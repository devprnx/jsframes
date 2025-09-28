/**
 * Utility functions for JSFrames library
 */

import { DataType, ScalarValue } from '../types';

/**
 * Infer the data type of a value
 */
export function inferDataType(value: any): DataType {
  if (value === null || value === undefined) {
    return 'null';
  }
  
  if (typeof value === 'number') {
    return 'number';
  }
  
  if (typeof value === 'string') {
    // Try to parse as date
    if (!isNaN(Date.parse(value))) {
      return 'date';
    }
    return 'string';
  }
  
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  
  if (value instanceof Date) {
    return 'date';
  }
  
  return 'object';
}

/**
 * Infer data type from an array of values
 */
export function inferArrayDataType(values: any[]): DataType {
  const types = new Set<DataType>();
  
  for (const value of values) {
    types.add(inferDataType(value));
  }
  
  // Priority order: number > date > string > boolean > object > null
  if (types.has('number')) return 'number';
  if (types.has('date')) return 'date';
  if (types.has('string')) return 'string';
  if (types.has('boolean')) return 'boolean';
  if (types.has('object')) return 'object';
  return 'null';
}

/**
 * Check if a value is null or undefined
 */
export function isNull(value: any): boolean {
  return value === null || value === undefined;
}

/**
 * Check if a value is numeric
 */
export function isNumeric(value: any): boolean {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Convert value to specified data type
 */
export function convertToType(value: any, dtype: DataType): any {
  if (isNull(value)) return null;
  
  switch (dtype) {
    case 'number':
      const num = Number(value);
      return isNaN(num) ? null : num;
    case 'string':
      return String(value);
    case 'boolean':
      return Boolean(value);
    case 'date':
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    default:
      return value;
  }
}

/**
 * Generate a range of numbers
 */
export function range(start: number, end?: number, step = 1): number[] {
  if (end === undefined) {
    end = start;
    start = 0;
  }
  
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * Generate a sequence of integers
 */
export function arange(start: number, end?: number, step = 1): number[] {
  return range(start, end, step);
}

/**
 * Create an array filled with a specific value
 */
export function full<T>(length: number, value: T): T[] {
  return new Array(length).fill(value);
}

/**
 * Create an array of zeros
 */
export function zeros(length: number): number[] {
  return full(length, 0);
}

/**
 * Create an array of ones
 */
export function ones(length: number): number[] {
  return full(length, 1);
}

/**
 * Calculate basic statistics for numeric array
 */
export function describe(values: number[]): {
  count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  '25%': number;
  '50%': number;
  '75%': number;
} {
  const cleaned = values.filter(v => isNumeric(v)).sort((a, b) => a - b);
  const n = cleaned.length;
  
  if (n === 0) {
    return {
      count: 0,
      mean: NaN,
      std: NaN,
      min: NaN,
      max: NaN,
      '25%': NaN,
      '50%': NaN,
      '75%': NaN
    };
  }
  
  const mean = cleaned.reduce((sum, v) => sum + v, 0) / n;
  const variance = cleaned.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
  const std = Math.sqrt(variance);
  
  const q1Index = Math.floor(n * 0.25);
  const q2Index = Math.floor(n * 0.5);
  const q3Index = Math.floor(n * 0.75);
  
  return {
    count: n,
    mean,
    std,
    min: cleaned[0],
    max: cleaned[n - 1],
    '25%': cleaned[q1Index],
    '50%': cleaned[q2Index],
    '75%': cleaned[q3Index]
  };
}

/**
 * Check if arrays are equal
 */
export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  
  return true;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}