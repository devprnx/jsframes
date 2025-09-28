/**
 * Core charting functionality using Chart.js
 */

import { Chart, ChartConfiguration, ChartType, ChartData, ChartOptions } from 'chart.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { DataFrame } from '../core/dataframe';
import { Series } from '../core/series';
import { isNumeric, isNull } from '../utils';

export interface PlotConfig {
  type: ChartType;
  width?: number;
  height?: number;
  title?: string;
  xlabel?: string;
  ylabel?: string;
  colors?: string[];
  theme?: 'light' | 'dark';
  grid?: boolean;
  legend?: boolean;
  animation?: boolean;
}

export class ChartBuilder {
  private config: ChartConfiguration;
  private canvas: ChartJSNodeCanvas;
  
  constructor(private plotConfig: PlotConfig) {
    const width = plotConfig.width || 800;
    const height = plotConfig.height || 600;
    
    this.canvas = new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: plotConfig.theme === 'dark' ? '#2d3748' : '#ffffff'
    });
    
    this.config = {
      type: plotConfig.type,
      data: {
        labels: [],
        datasets: []
      },
      options: this.buildOptions()
    };
  }
  
  private buildOptions(): ChartOptions {
    const { title, xlabel, ylabel, grid, legend, animation, theme } = this.plotConfig;
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!title,
          text: title,
          color: theme === 'dark' ? '#ffffff' : '#000000'
        },
        legend: {
          display: legend !== false,
          labels: {
            color: theme === 'dark' ? '#ffffff' : '#000000'
          }
        }
      },
      scales: {
        x: {
          title: {
            display: !!xlabel,
            text: xlabel,
            color: theme === 'dark' ? '#ffffff' : '#000000'
          },
          grid: {
            display: grid !== false,
            color: theme === 'dark' ? '#4a5568' : '#e2e8f0'
          },
          ticks: {
            color: theme === 'dark' ? '#a0aec0' : '#4a5568'
          }
        },
        y: {
          title: {
            display: !!ylabel,
            text: ylabel,
            color: theme === 'dark' ? '#ffffff' : '#000000'
          },
          grid: {
            display: grid !== false,
            color: theme === 'dark' ? '#4a5568' : '#e2e8f0'
          },
          ticks: {
            color: theme === 'dark' ? '#a0aec0' : '#4a5568'
          }
        }
      },
      animation: animation !== false ? {
        duration: 1000,
        easing: 'easeInOutQuart'
      } : false
    };
  }
  
  setData(labels: string[], datasets: any[]): ChartBuilder {
    this.config.data!.labels = labels;
    this.config.data!.datasets = datasets;
    return this;
  }
  
  addDataset(label: string, data: number[], options: any = {}): ChartBuilder {
    const colors = this.plotConfig.colors || [
      '#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5',
      '#dd6b20', '#319795', '#c53030', '#553c9a', '#2d3748'
    ];
    
    const datasetIndex = this.config.data!.datasets!.length;
    const color = colors[datasetIndex % colors.length];
    
    const dataset = {
      label,
      data,
      backgroundColor: options.backgroundColor || color + '80',
      borderColor: options.borderColor || color,
      borderWidth: options.borderWidth || 2,
      fill: options.fill !== undefined ? options.fill : false,
      ...options
    };
    
    this.config.data!.datasets!.push(dataset);
    return this;
  }
  
  async render(): Promise<Buffer> {
    return await this.canvas.renderToBuffer(this.config);
  }
  
  getConfig(): ChartConfiguration {
    return this.config;
  }
  
  async renderToFile(filename: string): Promise<void> {
    const buffer = await this.render();
    const fs = require('fs').promises;
    await fs.writeFile(filename, buffer);
  }
  
  // Static helper methods
  static fromSeries(series: Series, config: PlotConfig): ChartBuilder {
    const builder = new ChartBuilder(config);
    
    const values = series.values;
    const index = series.index.toArray().map(String);
    
    if (config.type === 'pie' || config.type === 'doughnut') {
      // For pie charts, use index as labels and values as data
      builder.setData(index, [{
        label: series.name || 'Series',
        data: values.filter(isNumeric)
      }]);
    } else {
      // For other chart types
      builder.setData(index, []);
      builder.addDataset(series.name || 'Series', values.filter(isNumeric));
    }
    
    return builder;
  }
  
  static fromDataFrame(df: DataFrame, config: PlotConfig & {
    x?: string;
    y?: string | string[];
  }): ChartBuilder {
    const builder = new ChartBuilder(config);
    
    const xCol = config.x || df.columns.get(0);
    const yColumns = config.y ? 
      (Array.isArray(config.y) ? config.y : [config.y]) : 
      df.columns.toArray().filter(col => col !== xCol).slice(0, 5); // Limit to 5 series
    
    // Get x-axis labels
    const xSeries = df.get(xCol);
    const labels = xSeries.values.map(String);
    
    builder.setData(labels, []);
    
    // Add datasets for each y column
    yColumns.forEach((yCol: string) => {
      if (df.columns.contains(yCol)) {
        const ySeries = df.get(yCol);
        const data = ySeries.values.map(v => isNumeric(v) ? v : 0);
        builder.addDataset(yCol, data);
      }
    });
    
    return builder;
  }
}