/**
 * Chainable async operations for JSFrames
 */

import { DataFrame } from '../core/dataframe';
import { Series } from '../core/series';

export class AsyncDataFrame {
  constructor(private df: DataFrame) {}
  
  // Async filtering
  async filter(predicate: (row: any, index: number) => Promise<boolean>): Promise<AsyncDataFrame> {
    const filteredIndices: number[] = [];
    
    for (let i = 0; i < this.df.shape[0]; i++) {
      const row = this.df.iloc(i);
      if (await predicate(row, i)) {
        filteredIndices.push(i);
      }
    }
    
    return new AsyncDataFrame(this.df.iloc(filteredIndices));
  }
  
  // Async mapping
  async map(transformer: (row: any, index: number) => Promise<any>): Promise<AsyncDataFrame> {
    const transformedData: any[] = [];
    
    for (let i = 0; i < this.df.shape[0]; i++) {
      const row = this.df.iloc(i);
      const transformed = await transformer(row, i);
      transformedData.push(transformed);
    }
    
    return new AsyncDataFrame(new DataFrame(transformedData));
  }
  
  // Async aggregation
  async reduce<T>(reducer: (acc: T, row: any, index: number) => Promise<T>, initialValue: T): Promise<T> {
    let accumulator = initialValue;
    
    for (let i = 0; i < this.df.shape[0]; i++) {
      const row = this.df.iloc(i);
      accumulator = await reducer(accumulator, row, i);
    }
    
    return accumulator;
  }
  
  // Parallel processing
  async parallelMap(transformer: (row: any, index: number) => Promise<any>, concurrency = 4): Promise<AsyncDataFrame> {
    const results: any[] = new Array(this.df.shape[0]);
    const chunks: number[][] = [];
    
    // Create chunks for parallel processing
    const chunkSize = Math.ceil(this.df.shape[0] / concurrency);
    for (let i = 0; i < this.df.shape[0]; i += chunkSize) {
      chunks.push(Array.from({ length: Math.min(chunkSize, this.df.shape[0] - i) }, (_, j) => i + j));
    }
    
    // Process chunks in parallel
    await Promise.all(chunks.map(async (chunk) => {
      for (const index of chunk) {
        const row = this.df.iloc(index);
        results[index] = await transformer(row, index);
      }
    }));
    
    return new AsyncDataFrame(new DataFrame(results));
  }
  
  // Batch processing
  async processBatches(batchProcessor: (batch: DataFrame) => Promise<DataFrame>, batchSize = 1000): Promise<AsyncDataFrame> {
    const results: DataFrame[] = [];
    
    for (let i = 0; i < this.df.shape[0]; i += batchSize) {
      const endIndex = Math.min(i + batchSize, this.df.shape[0]);
      const indices = Array.from({ length: endIndex - i }, (_, j) => i + j);
      const batch = this.df.iloc(indices);
      
      const processedBatch = await batchProcessor(batch);
      results.push(processedBatch);
    }
    
    // Concatenate results
    const { concat } = require('../operations/joins');
    const concatenated = results.reduce((acc, curr) => concat([acc, curr]), results[0]);
    
    return new AsyncDataFrame(concatenated);
  }
  
  // Get the underlying DataFrame
  toDataFrame(): DataFrame {
    return this.df;
  }
  
  // Chain with regular DataFrame operations
  chain(operation: (df: DataFrame) => DataFrame): AsyncDataFrame {
    return new AsyncDataFrame(operation(this.df));
  }
}

export class AsyncSeries {
  constructor(private series: Series) {}
  
  // Async transformation
  async map(transformer: (value: any, index: number) => Promise<any>): Promise<AsyncSeries> {
    const transformedValues: any[] = [];
    
    for (let i = 0; i < this.series.length; i++) {
      const value = this.series.iloc(i);
      const transformed = await transformer(value, i);
      transformedValues.push(transformed);
    }
    
    return new AsyncSeries(new Series(transformedValues, {
      index: this.series.index.copy(),
      name: this.series.name
    }));
  }
  
  // Async filtering
  async filter(predicate: (value: any, index: number) => Promise<boolean>): Promise<AsyncSeries> {
    const filteredValues: any[] = [];
    const filteredIndices: any[] = [];
    
    for (let i = 0; i < this.series.length; i++) {
      const value = this.series.iloc(i);
      if (await predicate(value, i)) {
        filteredValues.push(value);
        filteredIndices.push(this.series.index.get(i));
      }
    }
    
    const Index = require('../core/index').Index;
    return new AsyncSeries(new Series(filteredValues, {
      index: new Index(filteredIndices),
      name: this.series.name
    }));
  }
  
  // Get the underlying Series
  toSeries(): Series {
    return this.series;
  }
}

// Factory functions
export function async(df: DataFrame): AsyncDataFrame {
  return new AsyncDataFrame(df);
}

export function asyncSeries(series: Series): AsyncSeries {
  return new AsyncSeries(series);
}

// Utility functions for async operations
export async function asyncChain<T>(
  initialValue: T,
  operations: Array<(value: T) => Promise<T>>
): Promise<T> {
  let result = initialValue;
  
  for (const operation of operations) {
    result = await operation(result);
  }
  
  return result;
}

export async function asyncPipeline<T>(
  data: T[],
  pipeline: Array<(item: T) => Promise<T>>,
  concurrency = 4
): Promise<T[]> {
  const chunks: T[][] = [];
  const chunkSize = Math.ceil(data.length / concurrency);
  
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  
  const results = await Promise.all(chunks.map(async (chunk) => {
    const chunkResults: T[] = [];
    
    for (const item of chunk) {
      let result = item;
      for (const operation of pipeline) {
        result = await operation(result);
      }
      chunkResults.push(result);
    }
    
    return chunkResults;
  }));
  
  return results.flat();
}