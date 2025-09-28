/**
 * Performance optimizations and memory management
 */

import { Series } from '../core/series';
import { DataFrame } from '../core/dataframe';
import { isNull, isNumeric } from '../utils';

export interface PerformanceConfig {
  chunkSize: number;
  useWorkers: boolean;
  cacheResults: boolean;
  lazyEvaluation: boolean;
}

/**
 * Memory-efficient data processing utilities
 */
export class DataProcessor {
  private static readonly DEFAULT_CHUNK_SIZE = 10000;
  private cache = new Map<string, any>();

  constructor(private config: PerformanceConfig = {
    chunkSize: DataProcessor.DEFAULT_CHUNK_SIZE,
    useWorkers: false,
    cacheResults: true,
    lazyEvaluation: false
  }) {}

  /**
   * Process data in chunks to avoid memory issues
   */
  async processInChunks<T, R>(
    data: T[], 
    processor: (chunk: T[]) => R[], 
    chunkSize?: number
  ): Promise<R[]> {
    const size = chunkSize || this.config.chunkSize;
    const results: R[] = [];
    
    for (let i = 0; i < data.length; i += size) {
      const chunk = data.slice(i, i + size);
      const chunkResults = processor(chunk);
      results.push(...chunkResults);
      
      // Yield control to prevent blocking
      if (i % (size * 10) === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return results;
  }

  /**
   * Optimized filtering with early termination
   */
  filterOptimized<T>(data: T[], predicate: (item: T, index: number) => boolean, limit?: number): T[] {
    const results: T[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (predicate(data[i], i)) {
        results.push(data[i]);
        if (limit && results.length >= limit) break;
      }
    }
    
    return results;
  }

  /**
   * Memory-efficient sorting using external sort for large datasets
   */
  async sortLarge<T>(data: T[], compareFn: (a: T, b: T) => number): Promise<T[]> {
    if (data.length <= this.config.chunkSize) {
      return data.sort(compareFn);
    }

    // Split into chunks and sort each
    const chunks: T[][] = [];
    for (let i = 0; i < data.length; i += this.config.chunkSize) {
      const chunk = data.slice(i, i + this.config.chunkSize);
      chunks.push(chunk.sort(compareFn));
    }

    // Merge sorted chunks
    return this.mergeChunks(chunks, compareFn);
  }

  private mergeChunks<T>(chunks: T[][], compareFn: (a: T, b: T) => number): T[] {
    if (chunks.length === 1) return chunks[0];

    const result: T[] = [];
    const indices = new Array(chunks.length).fill(0);

    while (true) {
      let minIndex = -1;
      let minValue: T | undefined;

      // Find minimum among chunk heads
      for (let i = 0; i < chunks.length; i++) {
        if (indices[i] < chunks[i].length) {
          const value = chunks[i][indices[i]];
          if (minIndex === -1 || compareFn(value, minValue!) < 0) {
            minIndex = i;
            minValue = value;
          }
        }
      }

      if (minIndex === -1) break;

      result.push(minValue!);
      indices[minIndex]++;
    }

    return result;
  }

  /**
   * Cache computation results
   */
  memoize<Args extends any[], Return>(
    fn: (...args: Args) => Return,
    keyGenerator?: (...args: Args) => string
  ): (...args: Args) => Return {
    if (!this.config.cacheResults) return fn;

    return (...args: Args): Return => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }

      const result = fn(...args);
      this.cache.set(key, result);
      return result;
    };
  }

  /**
   * Clear cache to free memory
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; memoryUsage: number } {
    return {
      size: this.cache.size,
      memoryUsage: JSON.stringify([...this.cache]).length
    };
  }
}

/**
 * Lazy evaluation wrapper for deferred computation
 */
export class LazyOperation<T> {
  private _computed = false;
  private _result?: T;

  constructor(private operation: () => T) {}

  get value(): T {
    if (!this._computed) {
      this._result = this.operation();
      this._computed = true;
    }
    return this._result!;
  }

  map<R>(mapper: (value: T) => R): LazyOperation<R> {
    return new LazyOperation(() => mapper(this.value));
  }

  filter(predicate: (value: T) => boolean): LazyOperation<T | undefined> {
    return new LazyOperation(() => predicate(this.value) ? this.value : undefined);
  }

  static of<T>(value: T): LazyOperation<T> {
    return new LazyOperation(() => value);
  }
}

/**
 * Vectorized operations for better performance
 */
export class VectorOps {
  /**
   * Vectorized addition
   */
  static add(a: number[], b: number[] | number): number[] {
    if (typeof b === 'number') {
      return a.map(val => val + b);
    }
    
    if (a.length !== b.length) {
      throw new Error('Arrays must have the same length');
    }
    
    return a.map((val, i) => val + b[i]);
  }

  /**
   * Vectorized multiplication
   */
  static multiply(a: number[], b: number[] | number): number[] {
    if (typeof b === 'number') {
      return a.map(val => val * b);
    }
    
    if (a.length !== b.length) {
      throw new Error('Arrays must have the same length');
    }
    
    return a.map((val, i) => val * b[i]);
  }

  /**
   * Fast sum using Kahan summation for precision
   */
  static sum(values: number[]): number {
    let sum = 0;
    let c = 0; // Compensation for lost low-order bits

    for (const value of values) {
      if (isNumeric(value)) {
        const y = value - c;
        const t = sum + y;
        c = (t - sum) - y;
        sum = t;
      }
    }

    return sum;
  }

  /**
   * Fast mean calculation
   */
  static mean(values: number[]): number {
    const numericValues = values.filter(isNumeric);
    return numericValues.length > 0 ? this.sum(numericValues) / numericValues.length : NaN;
  }

  /**
   * Fast standard deviation
   */
  static std(values: number[]): number {
    const numericValues = values.filter(isNumeric);
    if (numericValues.length < 2) return NaN;

    const mean = this.mean(numericValues);
    const squaredDiffs = numericValues.map(val => Math.pow(val - mean, 2));
    const variance = this.sum(squaredDiffs) / (numericValues.length - 1);
    
    return Math.sqrt(variance);
  }

  /**
   * Fast min/max using single pass
   */
  static minmax(values: number[]): { min: number; max: number } {
    const numericValues = values.filter(isNumeric);
    if (numericValues.length === 0) {
      return { min: NaN, max: NaN };
    }

    let min = numericValues[0];
    let max = numericValues[0];

    for (let i = 1; i < numericValues.length; i++) {
      const val = numericValues[i];
      if (val < min) min = val;
      if (val > max) max = val;
    }

    return { min, max };
  }
}

/**
 * Memory pool for reusing objects
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private maxSize: number;

  constructor(
    private factory: () => T,
    private reset: (obj: T) => void,
    maxSize = 100
  ) {
    this.maxSize = maxSize;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool.length = 0;
  }

  get size(): number {
    return this.pool.length;
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static timers = new Map<string, number>();
  private static counters = new Map<string, number>();

  static startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  static endTimer(name: string): number {
    const start = this.timers.get(name);
    if (!start) {
      throw new Error(`Timer ${name} was not started`);
    }
    
    const duration = performance.now() - start;
    this.timers.delete(name);
    return duration;
  }

  static increment(name: string): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + 1);
  }

  static getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  static reset(): void {
    this.timers.clear();
    this.counters.clear();
  }

  static getStats(): { timers: [string, number][]; counters: [string, number][] } {
    return {
      timers: [...this.timers.entries()],
      counters: [...this.counters.entries()]
    };
  }
}