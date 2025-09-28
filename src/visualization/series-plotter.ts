/**
 * Series plotting functionality
 */

import { Series } from '../core/series';
import { ChartBuilder, PlotConfig } from './charts';
import { isNumeric } from '../utils';

export class SeriesPlotter {
  constructor(private series: Series) {}
  
  /**
   * Create a line plot of the series
   */
  async line(options: {
    title?: string;
    filename?: string;
  } & Partial<PlotConfig> = {}): Promise<Buffer | void> {
    const config: PlotConfig = {
      type: 'line',
      title: options.title || `Line Plot - ${this.series.name}`,
      xlabel: 'Index',
      ylabel: this.series.name || 'Value',
      ...options
    };
    
    const builder = ChartBuilder.fromSeries(this.series, config);
    
    if (options.filename) {
      await builder.renderToFile(options.filename);
      return;
    }
    
    return await builder.render();
  }
  
  /**
   * Create a bar plot of the series
   */
  async bar(options: {
    title?: string;
    filename?: string;
    horizontal?: boolean;
  } & Partial<PlotConfig> = {}): Promise<Buffer | void> {
    const config: PlotConfig = {
      type: 'bar',
      title: options.title || `Bar Plot - ${this.series.name}`,
      xlabel: 'Index',
      ylabel: this.series.name || 'Value',
      ...options
    };
    
    const builder = ChartBuilder.fromSeries(this.series, config);
    
    if (options.filename) {
      await builder.renderToFile(options.filename);
      return;
    }
    
    return await builder.render();
  }
  
  /**
   * Create a histogram of the series
   */
  async hist(options: {
    bins?: number;
    title?: string;
    filename?: string;
  } & Partial<PlotConfig> = {}): Promise<Buffer | void> {
    const config: PlotConfig = {
      type: 'bar',
      title: options.title || `Histogram - ${this.series.name}`,
      xlabel: this.series.name || 'Value',
      ylabel: 'Frequency',
      ...options
    };
    
    const numericValues = this.series.values.filter(isNumeric);
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
   * Create a pie chart (for categorical data or value counts)
   */
  async pie(options: {
    title?: string;
    filename?: string;
    limit?: number; // Limit number of slices
  } & Partial<PlotConfig> = {}): Promise<Buffer | void> {
    const config: PlotConfig = {
      type: 'pie',
      title: options.title || `Pie Chart - ${this.series.name}`,
      ...options
    };
    
    // Get value counts
    const uniqueValues = [...new Set(this.series.values.filter(v => v !== null && v !== undefined))];
    const valueCounts = uniqueValues.map(value => ({
      value,
      count: this.series.values.filter(v => v === value).length
    })).sort((a, b) => b.count - a.count);
    
    const labels = valueCounts.map(item => String(item.value));
    const data = valueCounts.map(item => item.count);
    
    // Limit slices if specified
    const limit = options.limit || 10;
    const limitedLabels = labels.slice(0, limit);
    const limitedData = data.slice(0, limit);
    
    // Add "Others" category if there are more values
    if (labels.length > limit) {
      const othersSum = data.slice(limit).reduce((sum: number, val: number) => sum + val, 0);
      limitedLabels.push('Others');
      limitedData.push(othersSum);
    }
    
    const builder = new ChartBuilder(config);
    builder.setData(limitedLabels, []);
    builder.addDataset(this.series.name || 'Value Counts', limitedData);
    
    if (options.filename) {
      await builder.renderToFile(options.filename);
      return;
    }
    
    return await builder.render();
  }
  
  /**
   * Create an area plot
   */
  async area(options: {
    title?: string;
    filename?: string;
  } & Partial<PlotConfig> = {}): Promise<Buffer | void> {
    const config: PlotConfig = {
      type: 'line',
      title: options.title || `Area Plot - ${this.series.name}`,
      xlabel: 'Index',
      ylabel: this.series.name || 'Value',
      ...options
    };
    
    const builder = ChartBuilder.fromSeries(this.series, config);
    
    // Modify the dataset to fill the area
    const chartConfig = builder.getConfig();
    if (chartConfig.data && chartConfig.data.datasets && chartConfig.data.datasets.length > 0) {
      (chartConfig.data.datasets[0] as any).fill = true;
    }
    
    if (options.filename) {
      await builder.renderToFile(options.filename);
      return;
    }
    
    return await builder.render();
  }
}