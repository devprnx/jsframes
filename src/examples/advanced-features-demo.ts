/**
 * JSFrames Advanced Features Demo
 * Demonstrates the enhanced capabilities including CSV operations, statistics, and data analysis
 */

import { DataFrame, Series } from '../index';

// Sample CSV data for demonstration
const csvData = `
name,age,city,salary,department,join_date,performance_score
Alice Johnson,28,New York,75000,Engineering,2020-01-15,8.5
Bob Smith,35,San Francisco,95000,Engineering,2019-03-20,9.2
Carol Davis,31,Chicago,68000,Marketing,2021-05-10,7.8
David Wilson,42,New York,82000,Finance,2018-11-05,8.9
Eve Brown,26,Seattle,71000,Engineering,2022-02-28,8.1
Frank Miller,39,Chicago,77000,Marketing,2020-07-18,7.5
Grace Lee,33,San Francisco,89000,Finance,2019-09-12,9.0
Henry Taylor,29,New York,73000,Engineering,2021-01-30,8.3
Isabel Garcia,37,Seattle,84000,Marketing,2018-08-14,8.7
Jack Wilson,45,Chicago,91000,Finance,2017-12-01,9.1
`;

async function advancedFeaturesDemo() {
  console.log('=== JSFrames Advanced Features Demo ===\n');

  // 1. Advanced CSV Reading
  console.log('1. Advanced CSV Reading with Options');
  console.log('=====================================');
  
  const df = DataFrame.readCSVAdvanced(csvData, {
    delimiter: ',',
    header: true,
    parseOptions: {
      parseNumbers: true,
      parseDates: true
    },
    dtypes: {
      'age': 'number',
      'salary': 'number',
      'join_date': 'date',
      'performance_score': 'number'
    }
  });

  console.log('DataFrame shape:', df.shape);
  console.log('DataFrame info:');
  console.log(df.head().toString());
  console.log();

  // 2. Data Validation
  console.log('2. Data Validation');
  console.log('==================');
  const validation = df.validateData();
  console.log('Data validation result:', validation);
  console.log('Memory usage:', df.memoryUsage());
  console.log();

  // 3. Statistical Analysis
  console.log('3. Advanced Statistical Analysis');
  console.log('================================');
  
  // Correlation matrix
  const correlationMatrix = df.correlation('pearson');
  console.log('Correlation Matrix:');
  console.log(correlationMatrix.toString());
  console.log();

  // Advanced statistics for salary series
  const salaryStats = df.get('salary');
  console.log('Salary Statistics:');
  console.log('- Mean:', salaryStats.mean());
  console.log('- Median:', salaryStats.median());
  console.log('- Q1 (25th percentile):', salaryStats.quantile(0.25));
  console.log('- Q3 (75th percentile):', salaryStats.quantile(0.75));
  console.log('- IQR:', salaryStats.iqr());
  console.log('- Skewness:', salaryStats.skew());
  console.log('- Kurtosis:', salaryStats.kurtosis());
  console.log('- Mode:', salaryStats.modeValues());
  console.log();

  // 4. Outlier Detection
  console.log('4. Outlier Detection');
  console.log('===================');
  const performanceOutliers = df.get('performance_score').detectOutliers('iqr');
  console.log('Performance Score Outliers (IQR method):', performanceOutliers);
  
  const salaryOutliers = df.get('salary').detectOutliers('zscore');
  console.log('Salary Outliers (Z-score method):', salaryOutliers);
  console.log();

  // 5. Rolling Window Analysis
  console.log('5. Rolling Window Analysis');
  console.log('==========================');
  const rollingMeanSalary = df.get('salary').rollingWindow(3, 'mean');
  const rollingStdSalary = df.get('salary').rollingWindow(3, 'std');
  
  console.log('3-period Rolling Mean Salary:');
  console.log(rollingMeanSalary.head().toString());
  console.log('\n3-period Rolling Std Salary:');
  console.log(rollingStdSalary.head().toString());
  console.log();

  // 6. Data Normalization
  console.log('6. Data Normalization');
  console.log('====================');
  const normalizedSalary = df.get('salary').normalize();
  const scaledPerformance = df.get('performance_score').minMaxScale(0, 100);
  
  console.log('Normalized Salary (Z-score):');
  console.log(normalizedSalary.head().toString());
  console.log('\nScaled Performance (0-100):');
  console.log(scaledPerformance.head().toString());
  console.log();

  // 7. Advanced Grouping and Aggregation
  console.log('7. Advanced Grouping and Aggregation');
  console.log('====================================');
  const deptAnalysis = df.groupby('department').agg({
    salary: ['mean', 'min', 'max', 'std'],
    age: ['mean', 'median'],
    performance_score: ['mean', 'count']
  });
  
  console.log('Department Analysis:');
  console.log(deptAnalysis.toString());
  console.log();

  // 8. Data Binning and Categorization
  console.log('8. Data Binning and Categorization');
  console.log('==================================');
  const ageGroups = df.get('age').cut(3, ['Young', 'Middle', 'Senior']);
  const salaryBands = df.get('salary').cut([60000, 75000, 85000, 100000], ['Low', 'Medium', 'High', 'Very High']);
  
  console.log('Age Groups:');
  console.log(ageGroups.valueCounts());
  console.log('\nSalary Bands:');
  console.log(salaryBands.valueCounts());
  console.log();

  // 9. Time Series Operations
  console.log('9. Time Series Operations');
  console.log('=========================');
  // Sort by join date and analyze tenure
  const sortedByDate = df.sortValues('join_date');
  const tenureMonths = sortedByDate.get('join_date').apply((date: Date) => {
    const now = new Date();
    return ((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30.44)).toFixed(1);
  });
  
  console.log('Employee Tenure (months):');
  console.log(tenureMonths.head().toString());
  console.log();

  // 10. Advanced Filtering and Selection
  console.log('10. Advanced Filtering and Selection');
  console.log('===================================');
  // Complex multi-condition filtering
  const highPerformers = df.where((row: any) => 
    row.performance_score >= 8.5 && 
    row.salary >= 75000 && 
    row.department === 'Engineering'
  );
  
  console.log('High Performing Engineers (score >= 8.5, salary >= 75k):');
  console.log(highPerformers.toString());
  console.log();

  // 11. Data Export with Advanced Options
  console.log('11. Advanced Data Export');
  console.log('=======================');
  const csvExport = df.toCSVAdvanced({
    delimiter: '|',
    includeIndex: false,
    header: true,
    columns: ['name', 'department', 'salary', 'performance_score'],
    quoting: 'minimal'
  });
  
  console.log('Custom CSV Export (pipe-delimited):');
  console.log(csvExport.substring(0, 300) + '...');
  console.log();

  // 12. Series Correlations and Relationships
  console.log('12. Series Correlations');
  console.log('======================');
  const salaryPerformanceCorr = df.get('salary').corr(df.get('performance_score'));
  const agePerformanceCorr = df.get('age').corr(df.get('performance_score'));
  
  console.log('Salary vs Performance Correlation:', salaryPerformanceCorr.toFixed(3));
  console.log('Age vs Performance Correlation:', agePerformanceCorr.toFixed(3));
  console.log();

  // 13. Data Quality Assessment
  console.log('13. Data Quality Assessment');
  console.log('==========================');
  const qualityReport = {
    totalRows: df.shape[0],
    totalColumns: df.shape[1],
    duplicates: 0, // df.duplicated().sum() - would need implementation
    nullValues: df.columns.toArray().map(col => ({
      column: col,
      nullCount: df.get(col).isNull().values.filter(Boolean).length,
      nullPercentage: ((df.get(col).isNull().values.filter(Boolean).length / df.shape[0]) * 100).toFixed(1) + '%'
    })),
    dataTypes: df.columns.toArray().map(col => ({
      column: col,
      dataType: df.get(col).dtype,
      uniqueValues: df.get(col).nunique()
    }))
  };
  
  console.log('Data Quality Report:');
  console.log('- Total Rows:', qualityReport.totalRows);
  console.log('- Total Columns:', qualityReport.totalColumns);
  console.log('- Null Values by Column:');
  qualityReport.nullValues.forEach(nv => {
    console.log(`  ${nv.column}: ${nv.nullCount} (${nv.nullPercentage})`);
  });
  console.log('- Data Types:');
  qualityReport.dataTypes.forEach(dt => {
    console.log(`  ${dt.column}: ${dt.dataType} (${dt.uniqueValues} unique values)`);
  });
  console.log();

  // 14. Performance Benchmarking
  console.log('14. Performance Benchmarking');
  console.log('============================');
  
  const startTime = Date.now();
  
  // Perform various operations
  const operations = [
    () => df.where((row: any) => row.salary > 70000),
    () => df.groupby('department').agg({ salary: 'mean' }),
    () => df.sortValues('performance_score', false),
    () => df.get('salary').describe(),
    () => df.correlation()
  ];
  
  const benchmarkResults = operations.map((operation, index) => {
    const opStart = Date.now();
    operation();
    const opEnd = Date.now();
    return {
      operation: `Operation ${index + 1}`,
      timeMs: opEnd - opStart
    };
  });
  
  const totalTime = Date.now() - startTime;
  
  console.log('Operation Performance:');
  benchmarkResults.forEach(result => {
    console.log(`- ${result.operation}: ${result.timeMs}ms`);
  });
  console.log(`- Total Time: ${totalTime}ms`);
  console.log();

  console.log('=== Demo Complete! ===');
  console.log('JSFrames now includes:');
  console.log('✓ Advanced CSV reading with type parsing');
  console.log('✓ Comprehensive statistical analysis');
  console.log('✓ Outlier detection methods');
  console.log('✓ Rolling window calculations');
  console.log('✓ Data normalization and scaling');
  console.log('✓ Advanced grouping and aggregation');
  console.log('✓ Data binning and categorization');
  console.log('✓ Time series operations');
  console.log('✓ Complex filtering and selection');
  console.log('✓ Flexible data export options');
  console.log('✓ Correlation analysis');
  console.log('✓ Data quality assessment');
  console.log('✓ Performance monitoring');
}

// Run the demo
if (require.main === module) {
  advancedFeaturesDemo().catch(console.error);
}

export { advancedFeaturesDemo };