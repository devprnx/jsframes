/**
 * DataFrame plotting functionality
 */

import { DataFrame } from '../core/dataframe';
import { ChartBuilder, PlotConfig } from './charts';
import { ChartType } from 'chart.js';

export class DataFramePlotter {
  constructor(private df: DataFrame) {}
  
  /**
   * Create a line plot
   */
  async line(options: {
    x?: string;
    y?: string | string[];
    title?: string;
    filename?: string;
  } & Partial<PlotConfig> = {}): Promise<Buffer | void> {
    const config: PlotConfig = {
      type: 'line',
      title: options.title || 'Line Plot',
      ...options
    };
    
    const builder = ChartBuilder.fromDataFrame(this.df, { ...config, x: options.x, y: options.y });
    
    if (options.filename) {
      await builder.renderToFile(options.filename);
      return;
    }
    
    return await builder.render();
  }
  
  /**
   * Create a bar plot
   */
  async bar(options: {
    x?: string;
    y?: string | string[];
    title?: string;
    filename?: string;
    horizontal?: boolean;
  } & Partial<PlotConfig> = {}): Promise<Buffer | void> {
    const config: PlotConfig = {
      type: options.horizontal ? 'bar' : 'bar',
      title: options.title || 'Bar Plot',
      ...options
    };
    
    const builder = ChartBuilder.fromDataFrame(this.df, { ...config, x: options.x, y: options.y });
    
    if (options.filename) {
      await builder.renderToFile(options.filename);
      return;
    }
    
    return await builder.render();
  }
  
  /**
   * Create a scatter plot
   */
  async scatter(options: {
    x: string;
    y: string;
    size?: string;
    color?: string;
    title?: string;
    filename?: string;
  } & Partial<PlotConfig>): Promise<Buffer | void> {
    const config: PlotConfig = {
      type: 'scatter',
      title: options.title || 'Scatter Plot',
      xlabel: options.x,
      ylabel: options.y,
      ...options
    };
    
    const builder = new ChartBuilder(config);
    
    const xSeries = this.df.get(options.x);
    const ySeries = this.df.get(options.y);
    
    const scatterData: number[] = [];
    const labels: string[] = [];
    
    for (let i = 0; i < xSeries.length; i++) {
      const x = xSeries.values[i];
      const y = ySeries.values[i];
      
      if (x !== null && y !== null && typeof x === 'number' && typeof y === 'number') {
        scatterData.push(y); // Use y values for the dataset
        labels.push(String(x)); // Use x values as labels
      }
    }
    
    builder.setData(labels, []);
    builder.addDataset(`${options.y} vs ${options.x}`, scatterData, {
      showLine: false,
      pointRadius: 5
    });
    
    if (options.filename) {
      await builder.renderToFile(options.filename);
      return;
    }
    
    return await builder.render();
  }
  
  /**
   * Create a histogram
   */
  async hist(options: {
    column: string;
    bins?: number;
    title?: string;
    filename?: string;
  } & Partial<PlotConfig>): Promise<Buffer | void> {
    const config: PlotConfig = {
      type: 'bar',
      title: options.title || `Histogram of ${options.column}`,
      xlabel: options.column,
      ylabel: 'Frequency',
      ...options
    };
    
    const series = this.df.get(options.column);
    const numericValues = series.values.filter(v => typeof v === 'number');
    
    const bins = options.bins || Math.ceil(Math.sqrt(numericValues.length));
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const binWidth = (max - min) / bins;
    
    const binCounts = new Array(bins).fill(0);
    const binLabels: string[] = [];
    
    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binWidth;
      const binEnd = min + (i + 1) * binWidth;
      binLabels.push(`${binStart.toFixed(2)}-${binEnd.toFixed(2)}`);
    }
    
    numericValues.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      binCounts[binIndex]++;
    });
    
    const builder = new ChartBuilder(config);
    builder.setData(binLabels, []);
    builder.addDataset('Frequency', binCounts);
    
    if (options.filename) {
      await builder.renderToFile(options.filename);
      return;
    }
    
    return await builder.render();
  }
  
  /**
   * Create a box plot (simplified version using bar chart)
   */
  async box(options: {
    columns?: string[];
    title?: string;
    filename?: string;
  } & Partial<PlotConfig> = {}): Promise<Buffer | void> {
    const columns = options.columns || this.df.columns.toArray().filter(col => {
      const series = this.df.get(col);
      return series.dtype === 'number';
    });
    
    const config: PlotConfig = {
      type: 'bar',
      title: options.title || 'Box Plot (Statistics)',
      ...options
    };
    
    const builder = new ChartBuilder(config);
    const stats = ['Min', 'Q1', 'Median', 'Q3', 'Max'];
    
    builder.setData(stats, []);
    
    columns.forEach(col => {
      const series = this.df.get(col);
      const desc = series.describe();
      const values = [
        desc['min'] || 0,
        desc['25%'] || 0, 
        desc['50%'] || 0,
        desc['75%'] || 0,
        desc['max'] || 0
      ];
      
      builder.addDataset(col, values);
    });
    
    if (options.filename) {
      await builder.renderToFile(options.filename);
      return;
    }
    
    return await builder.render();
  }
  
  /**
   * Create a correlation heatmap (simplified version)
   */
  async heatmap(options: {
    columns?: string[];
    title?: string;
    filename?: string;
  } & Partial<PlotConfig> = {}): Promise<Buffer | void> {
    const columns = options.columns || this.df.columns.toArray().filter(col => {
      const series = this.df.get(col);
      return series.dtype === 'number';
    }).slice(0, 10); // Limit for performance
    
    // Calculate correlation matrix
    const correlations: number[][] = [];
    
    for (const col1 of columns) {
      const row: number[] = [];
      for (const col2 of columns) {
        const series1 = this.df.get(col1);
        const series2 = this.df.get(col2);
        const corr = series1.corr(series2);
        row.push(isNaN(corr) ? 0 : corr);
      }
      correlations.push(row);
    }
    
    // Convert to chart format (simplified as bar chart showing averages)
    const config: PlotConfig = {
      type: 'bar',
      title: options.title || 'Correlation Matrix (Average Correlations)',
      ...options
    };
    
    const builder = new ChartBuilder(config);
    const avgCorrelations = correlations.map(row => 
      row.reduce((sum, val) => sum + Math.abs(val), 0) / row.length
    );
    
    builder.setData(columns, []);
    builder.addDataset('Avg Correlation', avgCorrelations);
    
    if (options.filename) {
      await builder.renderToFile(options.filename);
      return;
    }
    
    return await builder.render();
  }
}