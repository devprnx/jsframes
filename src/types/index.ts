/**
 * Core type definitions for JSFrames library
 */

export type DataType = 'number' | 'string' | 'boolean' | 'date' | 'object' | 'null';

export type ScalarValue = number | string | boolean | Date | null | undefined;

export type ArrayLike<T> = T[] | Float32Array | Float64Array | Int32Array | Uint32Array;

export interface IndexOptions {
  name?: string;
  dtype?: DataType;
}

export interface SeriesOptions<T = any> {
  index?: Index | ArrayLike<any>;
  name?: string;
  dtype?: DataType;
}

export interface DataFrameOptions {
  index?: Index | ArrayLike<any>;
  columns?: Index | string[];
}

export interface GroupByOptions {
  sort?: boolean;
  dropna?: boolean;
}

export interface JoinOptions {
  how?: 'inner' | 'outer' | 'left' | 'right';
  on?: string | string[];
  leftOn?: string | string[];
  rightOn?: string | string[];
  suffixes?: [string, string];
}

export interface ReadOptions {
  header?: number | boolean;
  index_col?: number | string;
  skiprows?: number;
  nrows?: number;
  dtype?: Record<string, DataType>;
  parse_dates?: boolean | string[];
}

export interface AggregateFunction {
  (values: any[]): any;
}

export interface WindowFunction {
  (values: any[], window: number): any[];
}

export type Aggregation = 
  | 'sum' 
  | 'mean' 
  | 'median' 
  | 'min' 
  | 'max' 
  | 'std' 
  | 'var' 
  | 'count' 
  | 'first' 
  | 'last'
  | AggregateFunction;

export interface PlotOptions {
  kind?: 'line' | 'bar' | 'scatter' | 'hist' | 'box' | 'area';
  x?: string;
  y?: string | string[];
  title?: string;
  xlabel?: string;
  ylabel?: string;
  figsize?: [number, number];
  color?: string | string[];
  alpha?: number;
}

export interface StreamOptions {
  batchSize?: number;
  windowSize?: number;
  flushInterval?: number;
}

// Abstract base classes and interfaces
export abstract class Index {
  abstract length: number;
  abstract dtype: DataType;
  abstract name?: string;
  
  abstract get(index: number): any;
  abstract slice(start?: number, end?: number): Index;
  abstract toArray(): any[];
  abstract equals(other: Index): boolean;
}

export abstract class BaseFrame {
  abstract shape: [number, number];
  abstract size: number;
  abstract empty: boolean;
  
  abstract head(n?: number): any;
  abstract tail(n?: number): any;
  abstract copy(): any;
  abstract equals(other: any): boolean;
}