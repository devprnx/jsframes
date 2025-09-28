/**
 * Visualization example for JSFrames
 */

import { DataFrame } from '../core/dataframe';
import { Series } from '../core/series';

async function visualizationDemo() {
  console.log('=== JSFrames Visualization Demo ===\n');
  
  // Create sample data for visualization
  const salesData = {
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    revenue: [10000, 12000, 15000, 13000, 18000, 20000],
    expenses: [8000, 9000, 11000, 10000, 13000, 14000],
    profit: [2000, 3000, 4000, 3000, 5000, 6000]
  };
  
  const df = new DataFrame(salesData);
  
  console.log('Sample Data:');
  console.log(df.toString());
  console.log('\\n');
  
  // Series visualizations
  const revenueSeries = df.get('revenue');
  
  try {
    console.log('1. Creating line plot for revenue...');
    await revenueSeries.plot.line({ 
      title: 'Monthly Revenue Trend',
      filename: 'revenue_line.png'
    });
    console.log('✓ Revenue line plot saved to revenue_line.png\\n');
    
    console.log('2. Creating bar chart for revenue...');
    await revenueSeries.plot.bar({ 
      title: 'Monthly Revenue',
      filename: 'revenue_bar.png'
    });
    console.log('✓ Revenue bar chart saved to revenue_bar.png\\n');
    
    console.log('3. Creating histogram of revenue distribution...');
    await revenueSeries.plot.hist({ 
      bins: 5,
      title: 'Revenue Distribution',
      filename: 'revenue_hist.png'
    });
    console.log('✓ Revenue histogram saved to revenue_hist.png\\n');
    
    console.log('4. Creating area plot for revenue...');
    await revenueSeries.plot.area({ 
      title: 'Monthly Revenue (Area)',
      filename: 'revenue_area.png'
    });
    console.log('✓ Revenue area plot saved to revenue_area.png\\n');
    
    // DataFrame visualizations
    console.log('5. Creating multi-line plot comparing metrics...');
    await df.plot.line({ 
      x: 'month',
      y: ['revenue', 'expenses', 'profit'],
      title: 'Financial Metrics Comparison',
      filename: 'metrics_comparison.png'
    });
    console.log('✓ Multi-line plot saved to metrics_comparison.png\\n');
    
    console.log('6. Creating bar chart comparison...');
    await df.plot.bar({ 
      x: 'month',
      y: ['revenue', 'expenses'],
      title: 'Revenue vs Expenses',
      filename: 'revenue_vs_expenses.png'
    });
    console.log('✓ Bar chart comparison saved to revenue_vs_expenses.png\\n');
    
    console.log('7. Creating scatter plot...');
    await df.plot.scatter({ 
      x: 'expenses',
      y: 'revenue',
      title: 'Revenue vs Expenses Scatter Plot',
      filename: 'scatter_plot.png'
    });
    console.log('✓ Scatter plot saved to scatter_plot.png\\n');
    
    console.log('8. Creating histogram of profit...');
    await df.plot.hist({ 
      column: 'profit',
      bins: 4,
      title: 'Profit Distribution',
      filename: 'profit_hist.png'
    });
    console.log('✓ Profit histogram saved to profit_hist.png\\n');
    
    console.log('9. Creating box plot of financial metrics...');
    await df.plot.box({ 
      columns: ['revenue', 'expenses', 'profit'],
      title: 'Financial Metrics Box Plot',
      filename: 'metrics_box.png'
    });
    console.log('✓ Box plot saved to metrics_box.png\\n');
    
    // Advanced visualization: Correlation heatmap
    console.log('10. Creating correlation heatmap...');
    await df.plot.heatmap({ 
      columns: ['revenue', 'expenses', 'profit'],
      title: 'Financial Metrics Correlation',
      filename: 'correlation_heatmap.png'
    });
    console.log('✓ Correlation heatmap saved to correlation_heatmap.png\\n');
    
    // Create sample categorical data for pie chart
    const categories = new Series(['Product A', 'Product B', 'Product A', 'Product C', 'Product B', 'Product A'], {
      name: 'Products'
    });
    
    console.log('11. Creating pie chart for product distribution...');
    await categories.plot.pie({ 
      title: 'Product Sales Distribution',
      filename: 'product_pie.png'
    });
    console.log('✓ Product pie chart saved to product_pie.png\\n');
    
  } catch (error) {
    console.error('Visualization error:', error instanceof Error ? error.message : String(error));
    console.log('Note: Some charts may require additional dependencies or environment setup.\\n');
  }
  
  // Display performance information
  console.log('=== Visualization Features Summary ===');
  console.log('✓ Line plots for trend analysis');
  console.log('✓ Bar charts for categorical comparisons');
  console.log('✓ Scatter plots for relationship analysis');
  console.log('✓ Histograms for distribution analysis');
  console.log('✓ Area plots for cumulative visualization');
  console.log('✓ Box plots for statistical summaries');
  console.log('✓ Pie charts for categorical distributions');
  console.log('✓ Correlation heatmaps for relationship matrices');
  console.log('✓ Multi-series plotting capabilities');
  console.log('✓ Customizable themes and colors');
  console.log('✓ File export (PNG format)');
  console.log('\\n=== JSFrames visualization demo completed! ===');
  console.log('Charts have been saved as PNG files in the current directory! 📊');
}

// Run the demo
visualizationDemo().catch(console.error);