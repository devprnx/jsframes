/**
 * Series implementation for JSFrames
 */

import { BaseFrame, DataType, SeriesOptions, Aggregation } from '../types';
import { Index } from './index';
import { 
  inferArrayDataType, 
  convertToType, 
  isNull, 
  isNumeric, 
  describe as utilDescribe,
  deepClone 
} from '../utils';

export class Series extends BaseFrame {
  private _data: any[];
  private _index: Index;
  private _dtype: DataType;
  private _name?: string;

  constructor(data: any[] = [], options: SeriesOptions = {}) {
    super();
    
    this._data = Array.from(data);
    this._dtype = options.dtype || inferArrayDataType(this._data);
    this._name = options.name;
    
    // Create index
    if (options.index) {
      this._index = options.index instanceof Index 
        ? options.index 
        : new Index(options.index as any[]);
    } else {
      this._index = Index.range(this._data.length);
    }
    
    // Validate index length matches data length
    if (this._index.length !== this._data.length) {
      throw new Error(`Index length (${this._index.length}) does not match data length (${this._data.length})`);
    }
    
    // Convert data to specified type if provided
    if (options.dtype) {
      this._data = this._data.map(value => convertToType(value, this._dtype));
    }
  }

  get shape(): [number, number] {
    return [this._data.length, 1];
  }

  get size(): number {
    return this._data.length;
  }

  get empty(): boolean {
    return this._data.length === 0;
  }

  get length(): number {
    return this._data.length;
  }

  get dtype(): DataType {
    return this._dtype;
  }

  get name(): string | undefined {
    return this._name;
  }

  set name(value: string | undefined) {
    this._name = value;
  }

  get index(): Index {
    return this._index;
  }

  get values(): any[] {
    return [...this._data];
  }

  // Indexing and Selection
  iloc(index: number | number[]): any | Series {
    if (typeof index === 'number') {
      if (index < 0) index = this._data.length + index;
      return this._data[index];
    }
    
    const selectedData = index.map(i => this._data[i < 0 ? this._data.length + i : i]);
    const selectedIndex = index.map(i => this._index.get(i < 0 ? this._data.length + i : i));
    
    return new Series(selectedData, {
      index: new Index(selectedIndex),
      dtype: this._dtype,
      name: this._name
    });
  }

  loc(label: any | any[]): any | Series {
    if (Array.isArray(label)) {
      const indices = label.map(l => this._index.indexOf(l)).filter(i => i !== -1);
      return this.iloc(indices);
    }
    
    const index = this._index.indexOf(label);
    if (index === -1) {
      throw new Error(`Label ${label} not found in index`);
    }
    
    return this._data[index];
  }

  // Basic operations
  head(n = 5): Series {
    const headData = this._data.slice(0, n);
    const headIndex = this._index.slice(0, n);
    
    return new Series(headData, {
      index: headIndex,
      dtype: this._dtype,
      name: this._name
    });
  }

  tail(n = 5): Series {
    const tailData = this._data.slice(-n);
    const tailIndex = this._index.slice(-n);
    
    return new Series(tailData, {
      index: tailIndex,
      dtype: this._dtype,
      name: this._name
    });
  }

  copy(): Series {
    return new Series(deepClone(this._data), {
      index: this._index.copy(),
      dtype: this._dtype,
      name: this._name
    });
  }

  equals(other: Series): boolean {
    if (this.length !== other.length) return false;
    if (!this._index.equals(other.index)) return false;
    
    for (let i = 0; i < this.length; i++) {
      if (this._data[i] !== other.iloc(i)) return false;
    }
    
    return true;
  }

  // Filtering and selection
  where(condition: (value: any, index: number) => boolean): Series {
    const filteredData: any[] = [];
    const filteredIndexData: any[] = [];
    
    this._data.forEach((value, i) => {
      if (condition(value, i)) {
        filteredData.push(value);
        filteredIndexData.push(this._index.get(i));
      }
    });
    
    return new Series(filteredData, {
      index: new Index(filteredIndexData),
      dtype: this._dtype,
      name: this._name
    });
  }

  // Null handling
  isNull(): Series {
    const nullMask = this._data.map(value => isNull(value));
    
    return new Series(nullMask, {
      index: this._index.copy(),
      dtype: 'boolean',
      name: this._name
    });
  }

  notNull(): Series {
    const notNullMask = this._data.map(value => !isNull(value));
    
    return new Series(notNullMask, {
      index: this._index.copy(),
      dtype: 'boolean',
      name: this._name
    });
  }

  dropna(): Series {
    return this.where((value) => !isNull(value));
  }

  fillna(value: any): Series {
    const filledData = this._data.map(v => isNull(v) ? value : v);
    
    return new Series(filledData, {
      index: this._index.copy(),
      dtype: this._dtype,
      name: this._name
    });
  }

  // Aggregation methods
  sum(): number {
    const numericValues = this._data.filter(isNumeric);
    return numericValues.reduce((sum, value) => sum + value, 0);
  }

  mean(): number {
    const numericValues = this._data.filter(isNumeric);
    return numericValues.length > 0 ? this.sum() / numericValues.length : NaN;
  }

  median(): number {
    const numericValues = this._data.filter(isNumeric).sort((a, b) => a - b);
    const len = numericValues.length;
    
    if (len === 0) return NaN;
    if (len % 2 === 0) {
      return (numericValues[len / 2 - 1] + numericValues[len / 2]) / 2;
    }
    return numericValues[Math.floor(len / 2)];
  }

  min(): any {
    const cleanedValues = this._data.filter(v => !isNull(v));
    return cleanedValues.length > 0 ? Math.min(...cleanedValues) : undefined;
  }

  max(): any {
    const cleanedValues = this._data.filter(v => !isNull(v));
    return cleanedValues.length > 0 ? Math.max(...cleanedValues) : undefined;
  }

  std(): number {
    const mean = this.mean();
    const numericValues = this._data.filter(isNumeric);
    
    if (numericValues.length <= 1) return NaN;
    
    const variance = numericValues.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (numericValues.length - 1);
    return Math.sqrt(variance);
  }

  count(): number {
    return this._data.filter(v => !isNull(v)).length;
  }

  nunique(): number {
    const uniqueValues = new Set(this._data.filter(v => !isNull(v)));
    return uniqueValues.size;
  }

  unique(): any[] {
    return Array.from(new Set(this._data));
  }

  valueCounts(): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    
    this._data.forEach(value => {
      if (!isNull(value)) {
        const key = String(value);
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    
    return counts;
  }

  // Sorting
  sort(ascending = true): Series {
    const sortedIndices = Array.from({ length: this.length }, (_, i) => i)
      .sort((i, j) => {
        const a = this._data[i];
        const b = this._data[j];
        
        if (isNull(a) && isNull(b)) return 0;
        if (isNull(a)) return 1;
        if (isNull(b)) return -1;
        
        if (a < b) return ascending ? -1 : 1;
        if (a > b) return ascending ? 1 : -1;
        return 0;
      });
    
    const sortedData = sortedIndices.map(i => this._data[i]);
    const sortedIndexData = sortedIndices.map(i => this._index.get(i));
    
    return new Series(sortedData, {
      index: new Index(sortedIndexData),
      dtype: this._dtype,
      name: this._name
    });
  }

  // Mathematical operations
  add(other: Series | number): Series {
    return this._mathOperation(other, (a, b) => a + b);
  }

  subtract(other: Series | number): Series {
    return this._mathOperation(other, (a, b) => a - b);
  }

  multiply(other: Series | number): Series {
    return this._mathOperation(other, (a, b) => a * b);
  }

  divide(other: Series | number): Series {
    return this._mathOperation(other, (a, b) => a / b);
  }

  private _mathOperation(other: Series | number, operation: (a: number, b: number) => number): Series {
    if (typeof other === 'number') {
      const result = this._data.map(value => {
        if (isNull(value) || !isNumeric(value)) return null;
        return operation(value, other);
      });
      
      return new Series(result, {
        index: this._index.copy(),
        dtype: 'number',
        name: this._name
      });
    } else {
      // Series operation
      if (this.length !== other.length) {
        throw new Error('Series lengths must match for mathematical operations');
      }
      
      const result = this._data.map((value, i) => {
        const otherValue = other.iloc(i);
        if (isNull(value) || isNull(otherValue) || !isNumeric(value) || !isNumeric(otherValue)) {
          return null;
        }
        return operation(value, otherValue);
      });
      
      return new Series(result, {
        index: this._index.copy(),
        dtype: 'number',
        name: this._name
      });
    }
  }

  // Statistical description
  describe(): { [key: string]: number } {
    if (this._dtype === 'number') {
      const numericValues = this._data.filter(isNumeric);
      return utilDescribe(numericValues);
    } else {
      return {
        count: this.count(),
        unique: this.nunique(),
        top: this.mode(),
        freq: Math.max(...Object.values(this.valueCounts()))
      };
    }
  }

  mode(): any {
    const counts = this.valueCounts();
    const maxCount = Math.max(...Object.values(counts));
    return Object.keys(counts).find(key => counts[key] === maxCount);
  }

  // String representation
  toString(): string {
    const maxDisplay = 10;
    const displayData = this._data.slice(0, maxDisplay);
    const displayIndex = this._index.slice(0, maxDisplay);
    
    let result = '';
    displayData.forEach((value, i) => {
      result += `${displayIndex.get(i)}    ${value}\n`;
    });
    
    if (this._data.length > maxDisplay) {
      result += '...\n';
    }
    
    result += `Length: ${this.length}, dtype: ${this._dtype}`;
    if (this._name) {
      result += `, Name: ${this._name}`;
    }
    
    return result;
  }

  // Plotting functionality
  get plot(): any {
    const { SeriesPlotter } = require('../visualization/series-plotter');
    return new SeriesPlotter(this);
  }

  // Advanced operations
  rolling(window: number, minPeriods?: number): any {
    const { Rolling } = require('../operations/transformations');
    return new Rolling(this, { window, minPeriods });
  }

  expanding(minPeriods = 1): any {
    const { Expanding } = require('../operations/transformations');
    return new Expanding(this, minPeriods);
  }

  get str(): any {
    const { StringAccessor } = require('../operations/transformations');
    return new StringAccessor(this);
  }

  get dt(): any {
    const { DateTimeAccessor } = require('../operations/transformations');
    return new DateTimeAccessor(this);
  }

  /**
   * Convert to categorical
   */
  astype(dtype: DataType): Series {
    const { convertToType } = require('../utils');
    const convertedData = this._data.map(value => convertToType(value, dtype));
    
    return new Series(convertedData, {
      index: this._index.copy(),
      name: this._name,
      dtype
    });
  }

  /**
   * Apply function to each element
   */
  apply(fn: (value: any, index: number) => any): Series {
    const result = this._data.map((value, i) => fn(value, i));
    
    return new Series(result, {
      index: this._index.copy(),
      name: this._name
    });
  }

  /**
   * Map values using a dictionary or function
   */
  map(mapper: { [key: string]: any } | ((value: any) => any)): Series {
    let result: any[];
    
    if (typeof mapper === 'function') {
      result = this._data.map((value) => (mapper as (value: any) => any)(value));
    } else {
      result = this._data.map(value => mapper[value] !== undefined ? mapper[value] : value);
    }
    
    return new Series(result, {
      index: this._index.copy(),
      name: this._name
    });
  }

  /**
   * Bin values into discrete intervals
   */
  cut(bins: number | number[], labels?: string[]): Series {
    if (typeof bins === 'number') {
      const min = this.min();
      const max = this.max();
      const step = (max - min) / bins;
      bins = Array.from({ length: bins + 1 }, (_, i) => min + i * step);
    }
    
    const result = this._data.map(value => {
      if (isNull(value) || !isNumeric(value)) return null;
      
      for (let i = 0; i < bins.length - 1; i++) {
        if (value >= bins[i] && value < bins[i + 1]) {
          return labels ? labels[i] : `(${bins[i]}, ${bins[i + 1]})`;
        }
      }
      
      // Handle edge case for max value
      if (value === bins[bins.length - 1]) {
        const lastIndex = bins.length - 2;
        return labels ? labels[lastIndex] : `(${bins[lastIndex]}, ${bins[lastIndex + 1]})`;
      }
      
      return null;
    });
    
    return new Series(result, {
      index: this._index.copy(),
      name: this._name,
      dtype: 'string'
    });
  }

  /**
   * Compute pairwise correlation with another series
   */
  corr(other: Series): number {
    if (this.length !== other.length) {
      throw new Error('Series must have the same length for correlation');
    }
    
    const pairs = this._data
      .map((val, i) => [val, other.iloc(i)])
      .filter(([a, b]) => isNumeric(a) && isNumeric(b));
    
    if (pairs.length < 2) return NaN;
    
    const n = pairs.length;
    const sumX = pairs.reduce((sum, [x]) => sum + x, 0);
    const sumY = pairs.reduce((sum, [, y]) => sum + y, 0);
    const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0);
    const sumX2 = pairs.reduce((sum, [x]) => sum + x * x, 0);
    const sumY2 = pairs.reduce((sum, [, y]) => sum + y * y, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? NaN : numerator / denominator;
  }

  /**
   * Compute autocorrelation
   */
  autocorr(lag = 1): number {
    if (lag >= this.length) return NaN;
    
    const shifted = this.shift(lag);
    return this.corr(shifted);
  }

  /**
   * Shift values by periods
   */
  shift(periods = 1): Series {
    const result = new Array(this.length);
    
    if (periods > 0) {
      // Shift forward (add nulls at beginning)
      for (let i = 0; i < periods; i++) {
        result[i] = null;
      }
      for (let i = periods; i < this.length; i++) {
        result[i] = this._data[i - periods];
      }
    } else if (periods < 0) {
      // Shift backward (add nulls at end)
      const absPeriods = Math.abs(periods);
      for (let i = 0; i < this.length - absPeriods; i++) {
        result[i] = this._data[i + absPeriods];
      }
      for (let i = this.length - absPeriods; i < this.length; i++) {
        result[i] = null;
      }
    } else {
      return this.copy();
    }
    
    return new Series(result, {
      index: this._index.copy(),
      name: this._name,
      dtype: this._dtype
    });
  }

  /**
   * Calculate quantile
   */
  quantile(q: number): number {
    if (q < 0 || q > 1) {
      throw new Error('Quantile must be between 0 and 1');
    }
    
    const numericValues = this._data.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
    if (numericValues.length === 0) return NaN;
    
    const index = q * (numericValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return numericValues[lower];
    }
    
    return numericValues[lower] * (upper - index) + numericValues[upper] * (index - lower);
  }

  /**
   * Calculate interquartile range
   */
  iqr(): number {
    return this.quantile(0.75) - this.quantile(0.25);
  }

  /**
   * Calculate skewness
   */
  skew(): number {
    const numericValues = this._data.filter(v => typeof v === 'number' && !isNaN(v));
    if (numericValues.length < 3) return NaN;
    
    const mean = this.mean();
    const std = this.std();
    
    if (std === 0) return 0;
    
    const skewness = numericValues.reduce((sum, x) => {
      return sum + Math.pow((x - mean) / std, 3);
    }, 0) / numericValues.length;
    
    return skewness;
  }

  /**
   * Calculate kurtosis
   */
  kurtosis(): number {
    const numericValues = this._data.filter(v => typeof v === 'number' && !isNaN(v));
    if (numericValues.length < 4) return NaN;
    
    const mean = this.mean();
    const std = this.std();
    
    if (std === 0) return -3; // Excess kurtosis for constant values
    
    const kurt = numericValues.reduce((sum, x) => {
      return sum + Math.pow((x - mean) / std, 4);
    }, 0) / numericValues.length;
    
    return kurt - 3; // Excess kurtosis
  }

  /**
   * Calculate mode (most frequent values)
   */
  modeValues(): any[] {
    const counts = this.valueCounts();
    const maxCount = Math.max(...Object.values(counts));
    return Object.keys(counts).filter(key => counts[key] === maxCount);
  }

  /**
   * Detect outliers using IQR method
   */
  detectOutliers(method: 'iqr' | 'zscore' = 'iqr'): { indices: number[]; values: number[] } {
    const indices: number[] = [];
    const values: number[] = [];
    
    if (method === 'iqr') {
      const q1 = this.quantile(0.25);
      const q3 = this.quantile(0.75);
      const iqrValue = q3 - q1;
      const lowerBound = q1 - 1.5 * iqrValue;
      const upperBound = q3 + 1.5 * iqrValue;
      
      this._data.forEach((value, index) => {
        if (typeof value === 'number' && (value < lowerBound || value > upperBound)) {
          indices.push(index);
          values.push(value);
        }
      });
    } else if (method === 'zscore') {
      const mean = this.mean();
      const std = this.std();
      
      this._data.forEach((value, index) => {
        if (typeof value === 'number') {
          const zscore = Math.abs((value - mean) / std);
          if (zscore > 3) {
            indices.push(index);
            values.push(value);
          }
        }
      });
    }
    
    return { indices, values };
  }

  /**
   * Rolling window calculations
   */
  rollingWindow(window: number, operation: 'mean' | 'sum' | 'std' | 'min' | 'max' = 'mean'): Series {
    if (window <= 0 || window > this.length) {
      throw new Error('Window size must be positive and <= series length');
    }
    
    const result: any[] = [];
    
    for (let i = 0; i < this.length; i++) {
      if (i < window - 1) {
        result.push(null);
      } else {
        const windowValues = this._data.slice(i - window + 1, i + 1)
                                      .filter(v => typeof v === 'number' && !isNaN(v));
        
        if (windowValues.length === 0) {
          result.push(null);
        } else {
          let value: number;
          switch (operation) {
            case 'mean':
              value = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
              break;
            case 'sum':
              value = windowValues.reduce((a, b) => a + b, 0);
              break;
            case 'std':
              const mean = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
              value = Math.sqrt(windowValues.reduce((sum, x) => sum + (x - mean) ** 2, 0) / windowValues.length);
              break;
            case 'min':
              value = Math.min(...windowValues);
              break;
            case 'max':
              value = Math.max(...windowValues);
              break;
          }
          result.push(value);
        }
      }
    }
    
    return new Series(result, { name: `${this._name}_${operation}_${window}`, index: this._index.copy() });
  }

  /**
   * Normalize series (z-score normalization)
   */
  normalize(): Series {
    const mean = this.mean();
    const std = this.std();
    
    if (std === 0) {
      throw new Error('Cannot normalize series with zero standard deviation');
    }
    
    const normalized = this._data.map(value => {
      if (typeof value === 'number' && !isNaN(value)) {
        return (value - mean) / std;
      }
      return value;
    });
    
    return new Series(normalized, { name: `${this._name}_normalized`, index: this._index.copy() });
  }

  /**
   * Min-max scaling
   */
  minMaxScale(min: number = 0, max: number = 1): Series {
    const seriesMin = this.min();
    const seriesMax = this.max();
    const range = seriesMax - seriesMin;
    
    if (range === 0) {
      throw new Error('Cannot scale series with zero range');
    }
    
    const scaled = this._data.map(value => {
      if (typeof value === 'number' && !isNaN(value)) {
        return min + (value - seriesMin) * (max - min) / range;
      }
      return value;
    });
    
    return new Series(scaled, { name: `${this._name}_scaled`, index: this._index.copy() });
  }

  /**
   * Calculate cumulative sum
   */
  cumsum(): Series {
    let sum = 0;
    const result = this._data.map(value => {
      if (isNumeric(value)) {
        sum += value;
        return sum;
      }
      return value;
    });
    
    return new Series(result, { name: `${this._name}_cumsum`, index: this._index.copy() });
  }
}