# 📊 JSFrames - Advanced TypeScript Data Analysis Library# 📊 JSFrames - Advanced TypeScript Data Analysis Library



[![npm version](https://badge.fury.io/js/jsframes.svg)](https://badge.fury.io/js/jsframes)[![npm version](https://badge.fury.io/js/jsframes.svg)](https://badge.fury.io/js/jsframes)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/your-username/jsframes)[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/your-username/jsframes)



A comprehensive, pandas-inspired data manipulation and analysis library for JavaScript and TypeScript. JSFrames brings the power of Python's pandas to the JavaScript ecosystem with modern TypeScript features, advanced statistical capabilities, and seamless data visualization.A comprehensive, pandas-inspired data manipulation and analysis library for JavaScript and TypeScript. JSFrames brings the power of Python's pandas to the JavaScript ecosystem with modern TypeScript features, advanced statistical capabilities, and seamless data visualization.



## 🚀 Key Features



### 📈 **Core Data Structures**[![npm version](https://badge.fury.io/js/jsframes.svg)](https://www.npmjs.com/package/jsframes)## 🌟 Features

- **DataFrame**: 2D labeled data structure with heterogeneous types

- **Series**: 1D labeled arrays with rich statistical methods  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

- **Index**: Flexible indexing system with advanced selection capabilities

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)### Core Data Structures

### 🔢 **Advanced Statistics**

- Comprehensive descriptive statistics (mean, median, mode, std, variance)- **DataFrame**: Powerful 2D labeled data structure with integrated indexing

- Percentiles and quantiles with customizable methods

- Skewness, kurtosis, and distribution analysis## ✨ Features- **Series**: 1D labeled array with rich statistical capabilities  

- Correlation matrices (Pearson, Spearman, Kendall)

- Outlier detection using IQR and Z-score methods- **Index**: Flexible indexing system with support for various data types

- Rolling window calculations and time series analysis

- **DataFrame & Series**: Powerful 2D and 1D data structures with rich functionality

### 📊 **Data Manipulation**

- Advanced filtering with complex conditions- **Data Manipulation**: Filtering, sorting, grouping, merging, and pivot operations### Data Manipulation

- Grouping and aggregation operations

- Pivot tables and cross-tabulations- **File I/O**: CSV, JSON, Excel support with streaming capabilities  - Advanced filtering, sorting, and selection operations

- Merging and joining datasets

- Data cleaning and validation utilities- **Visualization**: Optional Chart.js integration for plotting (install chart.js)- GroupBy operations with multiple aggregation functions

- Missing value handling strategies

- **Streaming**: Optional RxJS-powered real-time data processing (install rxjs)- Join/merge operations with flexible alignment

### 📁 **File I/O & Import/Export**

- CSV reading/writing with advanced parsing options- **Cloud Ready**: Optional AWS, Azure, GCP integrations (install respective SDKs)- Pivot tables and reshaping capabilities

- JSON import/export with nested structure support

- Excel file compatibility (with optional dependencies)- **TypeScript First**: Full type safety with excellent IntelliSense support- Comprehensive null value handling

- Database connectors for major SQL databases

- Streaming data processing capabilities



### 📈 **Visualization**## 🚀 Installation### File I/O (Coming Soon)

- Built-in Chart.js integration

- 11+ chart types (line, bar, scatter, pie, etc.)- CSV, JSON, Excel file support

- Customizable themes and styling

- Interactive plotting capabilities```bash- Parquet format integration

- Export charts as images or embedded HTML

# Core library- Database connectors

### ⚡ **Performance & Scalability**

- Lazy evaluation patterns for large datasets  npm install jsframes- Web API integration

- Memory usage optimization and monitoring

- GPU acceleration hooks (experimental)

- Streaming data processing with RxJS

- Async operations support# With visualization### Visualization (Coming Soon)



## 📦 Installationnpm install jsframes chart.js- Built-in plotting with D3.js integration



```bash- Interactive charts and graphs

npm install jsframes

```# With streaming- Customizable visualization themes



### Optional Dependencies (for enhanced features)npm install jsframes rxjs  



```bash### Advanced Features (Coming Soon)

# For data visualization

npm install chart.js chartjs-node-canvas# With cloud features- Real-time streaming data processing



# For streaming operations  npm install jsframes @aws-sdk/client-s3- GPU acceleration capabilities

npm install rxjs

```- Extensible plugin architecture

# For Excel file support

npm install xlsx- Cloud service integrations (AWS, Azure, GCP)



# For database connectivity## 💫 Quick Start

npm install sqlite3 mysql2 pg

```## 🚀 Quick Start



## 🏁 Quick Start```typescript



### Basic DataFrame Operationsimport { DataFrame } from 'jsframes';### Installation



```typescript

import { DataFrame, Series } from 'jsframes';

// Create DataFrame```bash

// Create a DataFrame from object

const data = {const df = new DataFrame({npm install jsframes

  name: ['Alice', 'Bob', 'Charlie', 'Diana'],

  age: [25, 30, 35, 28],  'name': ['Alice', 'Bob', 'Charlie'],```

  salary: [50000, 60000, 75000, 55000],

  department: ['Engineering', 'Marketing', 'Engineering', 'Sales']  'age': [25, 30, 35],

};

  'city': ['NY', 'LA', 'Chicago']### Basic Usage

const df = new DataFrame(data);

});

console.log('DataFrame Shape:', df.shape); // [4, 4]

console.log('First 3 rows:');```typescript

console.log(df.head(3));

// Basic operationsimport { DataFrame, Series } from 'jsframes';

// Basic statistics

console.log('Age Statistics:', df.get('age').describe());console.log(df.toString());

console.log('Salary Mean:', df.get('salary').mean()); // 60000

```console.log('Mean age:', df.get('age').mean());// Create a DataFrame



### Advanced CSV Operationsconst data = {



```typescript// Data manipulation  name: ['Alice', 'Bob', 'Charlie'],

// Read CSV with advanced options

const df = DataFrame.readCSVAdvanced(csvData, {const adults = df.filter(row => row.age >= 30);  age: [25, 30, 35],

  delimiter: ',',

  header: true,const summary = df.groupBy('city').agg({ age: 'mean' });  city: ['New York', 'San Francisco', 'Chicago']

  parseOptions: {

    parseNumbers: true,```};

    parseDates: true

  },

  dtypes: {

    'age': 'number',## 📊 Visualization (Optional)const df = new DataFrame(data);

    'salary': 'number',

    'join_date': 'date'console.log(df.toString());

  }

});```typescript



// Export with custom options  // Requires: npm install chart.js// Basic operations

const csvExport = df.toCSVAdvanced({

  delimiter: '|',import { DataFrame } from 'jsframes';console.log('Shape:', df.shape);           // [3, 3]

  includeIndex: false,

  header: true,console.log('Mean age:', df.get('age').mean());  // 30

  columns: ['name', 'department', 'salary'],

  quoting: 'minimal'const df = new DataFrame({

});

```  'month': ['Jan', 'Feb', 'Mar'],// Filtering



### Statistical Analysis  'sales': [100, 150, 200]const adults = df.where(row => row.age >= 30);



```typescript});console.log(adults.toString());

const salaryStats = df.get('salary');



// Advanced statistical methods

console.log('Median Salary:', salaryStats.median());// Create chart (if chart.js is installed)// Series operations

console.log('75th Percentile:', salaryStats.quantile(0.75));

console.log('Interquartile Range:', salaryStats.iqr());const chart = df.plot?.bar('month', 'sales', {const numbers = new Series([1, 2, 3, 4, 5]);

console.log('Skewness:', salaryStats.skew());

console.log('Kurtosis:', salaryStats.kurtosis());  title: 'Monthly Sales'console.log('Sum:', numbers.sum());        // 15



// Outlier detection});console.log('Mean:', numbers.mean());      // 3

const outliers = salaryStats.detectOutliers('iqr');

console.log('Salary Outliers:', outliers);``````



// Data normalization

const normalized = salaryStats.normalize(); // Z-score normalization

const scaled = salaryStats.minMaxScale(0, 100); // Min-max scaling## 🔄 Streaming (Optional)## 📖 Documentation

```



### Correlation Analysis

```typescript### DataFrame

```typescript

// Correlation matrix for all numeric columns// Requires: npm install rxjs

const corrMatrix = df.correlation('pearson');

console.log('Correlation Matrix:');import { DataFrameStream } from 'jsframes/streaming';Create DataFrames from various data sources:

console.log(corrMatrix.toString());



// Specific column correlations

const agePerformanceCorr = df.get('age').corr(df.get('performance_score'));const stream = new DataFrameStream();```typescript

console.log('Age-Performance Correlation:', agePerformanceCorr);

```stream.subscribe(df => {// From object



### Data Filtering and Selection  const processed = df.filter(row => row.value > 0);const df1 = new DataFrame({



```typescript  console.log('Processed:', processed.shape);  col1: [1, 2, 3],

// Complex filtering conditions

const highPerformers = df.where((row: any) => });  col2: ['a', 'b', 'c']

  row.performance_score >= 8.5 && 

  row.salary >= 75000 && ```});

  row.department === 'Engineering'

);



// Column selection and transformation## 🏗️ Core API// From 2D array

const subset = df.select(['name', 'department', 'salary'])

                .where((row: any) => row.salary > 60000);const df2 = new DataFrame([

```

### DataFrame  [1, 'a'],

### Grouping and Aggregation

  [2, 'b'],

```typescript

// Group by department and calculate statistics```typescript  [3, 'c']

const deptAnalysis = df.groupby('department').agg({

  salary: ['mean', 'min', 'max', 'std'],const df = new DataFrame(data);], { columns: ['col1', 'col2'] });

  age: ['mean', 'median'],

  performance_score: ['mean', 'count']

});

// Selection// From array of objects

console.log('Department Analysis:');

console.log(deptAnalysis.toString());df.head(5)                  // First 5 rowsconst df3 = new DataFrame([

```

df.get('column')            // Get column as Series  { col1: 1, col2: 'a' },

### Rolling Window Operations

df.select(['col1', 'col2']) // Select columns  { col1: 2, col2: 'b' },

```typescript

const prices = new Series([100, 102, 98, 105, 107, 103, 110]);  { col1: 3, col2: 'c' }



// Calculate rolling statistics// Filtering]);

const rollingMean = prices.rollingWindow(3, 'mean');

const rollingStd = prices.rollingWindow(3, 'std');df.filter(row => row.age > 25)```

const rollingMax = prices.rollingWindow(3, 'max');

df.dropNA()                 // Remove null values

console.log('3-period Rolling Mean:', rollingMean.toString());

```### Key Methods



### Data Visualization// Grouping



```typescriptdf.groupBy('category').agg({ value: 'sum' })```typescript

// Requires optional chart.js dependency

import { DataFramePlotter } from 'jsframes/visualization';// Selection



const plotter = new DataFramePlotter(df);// Joiningdf.head(5)              // First 5 rows



// Create various chart typesdf.merge(otherDf, 'id', 'inner')df.tail(3)              // Last 3 rows

await plotter.plot('salary', 'age', { 

  type: 'scatter',df.get('column')        // Get column as Series

  title: 'Salary vs Age Distribution',

  theme: 'modern'// I/Odf.select(['col1', 'col2'])  // Select multiple columns

});

DataFrame.readCSV(csvData)

await plotter.histogram('salary', {

  bins: 10,df.toCSV()// Indexing

  title: 'Salary Distribution'

});```df.iloc(0)              // Get row by position



await plotter.groupedBarChart('department', 'salary');df.loc('index_label')   // Get row by label

```

### Seriesdf.iloc([0, 2, 4])      // Multiple rows by position

## 📚 Advanced Examples



### Time Series Analysis

```typescript// Filtering

```typescript

import { DataFrame } from 'jsframes';const series = new Series([1, 2, 3, 4, 5]);df.where(row => row.age > 25)



// Load time series datadf.dropna()             // Remove null values

const tsData = DataFrame.readCSVAdvanced(stockData, {

  parseOptions: { parseDates: true },// Statisticsdf.fillna(0)            // Fill null values

  dtypes: { 'date': 'date', 'price': 'number', 'volume': 'number' }

});series.mean()               // 3



// Sort by date and calculate rolling metricsseries.sum()                // 15// Aggregation

const sortedData = tsData.sortValues('date');

const prices = sortedData.get('price');series.std()                // Standard deviationdf.sum()                // Sum of numeric columns



// Technical indicatorsseries.describe()           // Full statisticsdf.mean()               // Mean of numeric columns

const sma20 = prices.rollingWindow(20, 'mean');

const volatility = prices.rollingWindow(20, 'std');df.describe()           // Statistical summary

const returns = prices.pct_change();

// Operations

// Detect price anomalies

const priceOutliers = prices.detectOutliers('zscore');series.add(10)              // Add scalar// Sorting

console.log('Price Outliers:', priceOutliers);

```series.filter(x => x > 2)   // Filter valuesdf.sortValues('column')



### Data Quality Assessment```df.sortValues(['col1', 'col2'])



```typescript```

// Comprehensive data validation

const validation = df.validateData();## 📁 File I/O

console.log('Validation Results:', validation);

### Series

// Memory usage analysis

const memoryUsage = df.memoryUsage();```typescript

console.log('Memory Usage by Column:', memoryUsage);

// CSV```typescript

// Check for duplicates and missing values

const duplicateRows = df.duplicated().sum();const df = DataFrame.readCSV(csvString);const s = new Series([1, 2, 3, null, 5], { name: 'numbers' });

const missingData = df.columns.toArray().map(col => ({

  column: col,df.toCSV();

  nullCount: df.get(col).isNull().sum(),

  nullPercentage: (df.get(col).isNull().sum() / df.shape[0] * 100).toFixed(1) + '%'// Basic info

}));

// JSONs.length                // 5

console.log('Data Quality Report:');

console.log('- Duplicate Rows:', duplicateRows);const df2 = DataFrame.readJSON(jsonString);s.dtype                 // 'number'

console.log('- Missing Data:', missingData);

```df2.toJSON();s.shape                 // [5, 1]



## 🎯 API Reference



### DataFrame Methods// Excel (requires xlsx package)// Statistics



#### Data Accessconst df3 = DataFrame.readExcel(buffer);s.sum()                 // 11

- `head(n)` - First n rows

- `tail(n)` - Last n rows  ```s.mean()                // 2.75

- `get(column)` - Get Series by column name

- `iloc(rows, cols)` - Integer-location based indexings.std()                 // Standard deviation

- `loc(rows, cols)` - Label-location based indexing

## 🎯 Why JSFrames?s.describe()            // Complete statistical summary

#### Data Manipulation

- `where(condition)` - Filter rows by condition

- `select(columns)` - Select specific columns

- `drop(columns)` - Drop columns| Feature | JSFrames | Other Libraries |// Null handling

- `sortValues(by, ascending)` - Sort by column values

- `groupby(by)` - Group data by column values|---------|----------|----------------|s.isNull()              // Boolean mask



#### Statistical Operations| **TypeScript** | ✅ First-class | ⚡ Varies |s.dropna()              // Remove nulls

- `describe()` - Descriptive statistics

- `correlation(method)` - Correlation matrix| **Pandas-like API** | ✅ Full compatibility | ❌ Limited |s.fillna(0)             // Fill nulls

- `covariance()` - Covariance matrix

- `validateData()` - Data quality validation| **Optional Dependencies** | ✅ Minimal core | ❌ Heavy bundles |

- `memoryUsage()` - Memory consumption by column

| **Visualization** | ✅ Chart.js integration | ⚡ Separate packages |// Mathematical operations

#### I/O Operations

- `readCSVAdvanced(data, options)` - Advanced CSV parsing| **Streaming** | ✅ RxJS powered | ❌ None |s.add(10)               // Add scalar

- `toCSVAdvanced(options)` - Advanced CSV export

- `toJSON(orient)` - JSON export| **Cloud Ready** | ✅ AWS/Azure/GCP | ❌ Manual setup |s.multiply(2)           // Multiply by scalar

- `fromJSON(data)` - JSON import

s.add(otherSeries)      // Element-wise addition

### Series Methods

## 🧪 Development```

#### Basic Statistics

- `mean()`, `median()`, `mode()` - Central tendency

- `std()`, `var()` - Variability measures

- `min()`, `max()` - Extreme values```bash## 🛠 Development

- `sum()`, `count()` - Aggregation functions

git clone https://github.com/username/jsframes.git

#### Advanced Statistics  

- `quantile(q)` - Percentile calculationscd jsframes### Prerequisites

- `iqr()` - Interquartile range

- `skew()` - Skewness coefficientnpm install- Node.js 16+

- `kurtosis()` - Kurtosis coefficient

- `describe()` - Comprehensive statisticsnpm run build- TypeScript 5+



#### Data Analysisnpm test

- `detectOutliers(method)` - Outlier detection ('iqr', 'zscore')

- `rollingWindow(window, operation)` - Rolling calculations```### Setup

- `normalize()` - Z-score normalization

- `minMaxScale(min, max)` - Min-max scaling

- `corr(other)` - Correlation with another Series

## 📚 Examples```bash

#### Data Transformation

- `apply(func)` - Apply function to each element# Clone the repository

- `map(mapping)` - Map values using dictionary/function

- `cut(bins, labels)` - Binning operationsCheck out the [examples directory](./src/examples/) for comprehensive usage examples including:git clone https://github.com/yourusername/jsframes.git

- `cumsum()` - Cumulative sum

- `pct_change()` - Percentage changecd jsframes



## 🔧 Configuration Options- Basic data manipulation



### CSV Reading Options- Advanced operations# Install dependencies



```typescript- Visualization demosnpm install

interface CSVReadOptions {

  delimiter?: string;           // Column separator (default: ',')- Streaming data processing

  header?: boolean;            // First row contains headers (default: true)

  skipRows?: number;           // Rows to skip from beginning (default: 0)- Cloud integrations# Build the project

  parseOptions?: {

    parseNumbers?: boolean;     // Auto-parse numeric values (default: true)npm run build

    parseDates?: boolean;      // Auto-parse date values (default: false)

    dateFormat?: string;       // Date parsing format## 🤝 Contributing

  };

  dtypes?: Record<string, string>; // Explicit column types# Run tests

  encoding?: string;           // File encoding (default: 'utf-8')

}We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md).npm test

```



## 🌟 Performance Tips

1. Fork the repository# Run example

1. **Use appropriate data types**: Specify dtypes when reading CSV for better performance

2. **Lazy evaluation**: Chain operations for optimized execution2. Create your feature branchnpm run dev

3. **Memory management**: Use `memoryUsage()` to monitor and optimize memory consumption

4. **Streaming for large datasets**: Use streaming operations for data that doesn't fit in memory3. Commit your changes```

5. **Vectorized operations**: Prefer built-in methods over manual loops

4. Push to the branch

## 🛠️ Development & Contributing

5. Open a Pull Request### Project Structure

### Building from Source



```bash

git clone https://github.com/your-username/jsframes.git## 📄 License```

cd jsframes

npm installsrc/

npm run build

npm testThis project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.├── core/           # Core data structures

```

│   ├── index.ts    # Index implementation

### Project Structure

## 🙏 Acknowledgments│   ├── series.ts   # Series implementation

```

src/│   └── dataframe.ts # DataFrame implementation

├── core/           # DataFrame, Series, Index classes

├── operations/     # Data manipulation operations  - Inspired by [pandas](https://pandas.pydata.org/) - the amazing Python data analysis library├── operations/     # Data manipulation operations

├── io/            # File I/O and database connectors

├── visualization/ # Chart.js integration- Built with [TypeScript](https://www.typescriptlang.org/) for type safety├── io/            # File I/O operations

├── utils/         # Utility functions

├── types/         # TypeScript type definitions├── visualization/ # Plotting and charts

└── examples/      # Example usage files

```---├── streaming/     # Real-time data processing



## 📄 License├── cloud/         # Cloud service integrations



This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.**Made with ❤️ for the JavaScript data science community**├── plugins/       # Plugin architecture

├── types/         # TypeScript definitions

## 🙏 Acknowledgments├── utils/         # Utility functions

├── examples/      # Example usage

- Inspired by Python's pandas library└── benchmarks/    # Performance tests

- Built with TypeScript for type safety```

- Chart.js for visualization capabilities

- RxJS for reactive programming support## 🧪 Testing



## 📞 Support```bash

# Run all tests

- 📖 [Documentation](https://github.com/your-username/jsframes/wiki)npm test

- 🐛 [Issue Tracker](https://github.com/your-username/jsframes/issues)

- 💬 [Discussions](https://github.com/your-username/jsframes/discussions)# Run with coverage

- 📧 [Email Support](mailto:support@jsframes.dev)npm run test:coverage



---# Run specific test file

npm test -- series.test.ts

**JSFrames** - Bringing the power of data science to JavaScript! 🚀✨```

## 📊 Performance

JSFrames is designed for performance with:

- Memory-efficient data storage
- Lazy evaluation where applicable
- Optimized algorithms for common operations
- Optional GPU acceleration (coming soon)

Benchmarks show competitive performance with other JavaScript data libraries while providing a much richer API surface.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Areas for Contribution
- Additional statistical functions
- New file format support
- Visualization improvements
- Performance optimizations
- Documentation and examples

## 📋 Roadmap

### Version 1.1
- [ ] Complete I/O module (CSV, JSON, Excel)
- [ ] Basic visualization with D3.js
- [ ] GroupBy operations
- [ ] Join/merge operations

### Version 1.2
- [ ] Streaming data processing
- [ ] Plugin system
- [ ] Advanced statistical functions
- [ ] Performance optimizations

### Version 2.0
- [ ] GPU acceleration
- [ ] Cloud integrations
- [ ] Interactive web-based data explorer
- [ ] Notebook export functionality

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Python's pandas library
- Built with TypeScript for type safety
- Leverages modern JavaScript features for performance

**JSFrames** - Bringing pandas-grade data analysis to JavaScript! 🐼➡️🚀
