/**
 * Advanced data transformation operations
 */

import { Series } from '../core/series';
import { Index } from '../core/index';
import { DataFrame } from '../core/dataframe';
import { isNull, isNumeric } from '../utils';

export interface WindowOptions {
  window: number;
  minPeriods?: number;
  center?: boolean;
}

export interface ResampleOptions {
  rule: string; // 'D', 'H', 'M', etc.
  how?: 'mean' | 'sum' | 'count' | 'min' | 'max' | 'first' | 'last';
}

/**
 * Rolling window operations
 */
export class Rolling {
  constructor(
    private data: Series,
    private options: WindowOptions
  ) {}

  mean(): Series {
    return this.apply((values: number[]) => {
      const numericValues = values.filter(isNumeric);
      return numericValues.length > 0 
        ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
        : NaN;
    });
  }

  sum(): Series {
    return this.apply((values: number[]) => {
      const numericValues = values.filter(isNumeric);
      return numericValues.reduce((sum, val) => sum + val, 0);
    });
  }

  min(): Series {
    return this.apply((values: number[]) => {
      const numericValues = values.filter(isNumeric);
      return numericValues.length > 0 ? Math.min(...numericValues) : NaN;
    });
  }

  max(): Series {
    return this.apply((values: number[]) => {
      const numericValues = values.filter(isNumeric);
      return numericValues.length > 0 ? Math.max(...numericValues) : NaN;
    });
  }

  std(): Series {
    return this.apply((values: number[]) => {
      const numericValues = values.filter(isNumeric);
      if (numericValues.length < 2) return NaN;
      
      const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (numericValues.length - 1);
      return Math.sqrt(variance);
    });
  }

  private apply(fn: (values: number[]) => number): Series {
    const result: number[] = [];
    const values = this.data.values;
    
    for (let i = 0; i < values.length; i++) {
      const startIndex = Math.max(0, i - this.options.window + 1);
      const endIndex = i + 1;
      const windowValues = values.slice(startIndex, endIndex);
      
      if (windowValues.length < (this.options.minPeriods || 1)) {
        result.push(NaN);
      } else {
        result.push(fn(windowValues));
      }
    }
    
    return new Series(result, {
      index: this.data.index.copy(),
      name: this.data.name
    });
  }
}

/**
 * Expanding window operations
 */
export class Expanding {
  constructor(private data: Series, private minPeriods: number = 1) {}

  mean(): Series {
    return this.apply((values: number[]) => {
      const numericValues = values.filter(isNumeric);
      return numericValues.length > 0
        ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
        : NaN;
    });
  }

  sum(): Series {
    return this.apply((values: number[]) => {
      const numericValues = values.filter(isNumeric);
      return numericValues.reduce((sum, val) => sum + val, 0);
    });
  }

  private apply(fn: (values: number[]) => number): Series {
    const result: number[] = [];
    const values = this.data.values;
    
    for (let i = 0; i < values.length; i++) {
      const windowValues = values.slice(0, i + 1);
      
      if (windowValues.length < this.minPeriods) {
        result.push(NaN);
      } else {
        result.push(fn(windowValues));
      }
    }
    
    return new Series(result, {
      index: this.data.index.copy(),
      name: this.data.name
    });
  }
}

/**
 * String operations for Series
 */
export class StringAccessor {
  constructor(private data: Series) {}

  upper(): Series {
    const result = this.data.values.map((value: any) => 
      typeof value === 'string' ? value.toUpperCase() : value
    );
    
    return new Series(result, {
      index: this.data.index.copy(),
      name: this.data.name,
      dtype: this.data.dtype
    });
  }

  lower(): Series {
    const result = this.data.values.map(value => 
      typeof value === 'string' ? value.toLowerCase() : value
    );
    
    return new Series(result, {
      index: this.data.index.copy(),
      name: this.data.name,
      dtype: this.data.dtype
    });
  }

  contains(pattern: string | RegExp): Series {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const result = this.data.values.map(value => 
      typeof value === 'string' ? regex.test(value) : false
    );
    
    return new Series(result, {
      index: this.data.index.copy(),
      name: this.data.name,
      dtype: 'boolean'
    });
  }

  startswith(pattern: string): Series {
    const result = this.data.values.map(value => 
      typeof value === 'string' ? value.startsWith(pattern) : false
    );
    
    return new Series(result, {
      index: this.data.index.copy(),
      name: this.data.name,
      dtype: 'boolean'
    });
  }

  endswith(pattern: string): Series {
    const result = this.data.values.map(value => 
      typeof value === 'string' ? value.endsWith(pattern) : false
    );
    
    return new Series(result, {
      index: this.data.index.copy(),
      name: this.data.name,
      dtype: 'boolean'
    });
  }

  len(): Series {
    const result = this.data.values.map(value => 
      typeof value === 'string' ? value.length : NaN
    );
    
    return new Series(result, {
      index: this.data.index.copy(),
      name: this.data.name,
      dtype: 'number'
    });
  }

  replace(pattern: string | RegExp, replacement: string): Series {
    const result = this.data.values.map(value => {
      if (typeof value === 'string') {
        return typeof pattern === 'string' 
          ? value.replace(new RegExp(pattern, 'g'), replacement)
          : value.replace(pattern, replacement);
      }
      return value;
    });
    
    return new Series(result, {
      index: this.data.index.copy(),
      name: this.data.name,
      dtype: this.data.dtype
    });
  }

  split(delimiter: string): Series {
    const result = this.data.values.map(value => 
      typeof value === 'string' ? value.split(delimiter) : null
    );
    
    return new Series(result, {
      index: this.data.index.copy(),
      name: this.data.name,
      dtype: 'object'
    });
  }
}

/**
 * DateTime operations for Series
 */
export class DateTimeAccessor {
  constructor(private data: Series) {}

  year(): Series {
    const result = this.data.values.map(value => {
      const date = this.toDate(value);
      return date ? date.getFullYear() : NaN;
    });
    
    return new Series(result, {
      index: this.data.index.copy(),
      name: this.data.name,
      dtype: 'number'
    });
  }

  month(): Series {
    const result = this.data.values.map(value => {
      const date = this.toDate(value);
      return date ? date.getMonth() + 1 : NaN;
    });
    
    return new Series(result, {
      index: this.data.index.copy(),
      name: this.data.name,
      dtype: 'number'
    });
  }

  day(): Series {
    const result = this.data.values.map(value => {
      const date = this.toDate(value);
      return date ? date.getDate() : NaN;
    });
    
    return new Series(result, {
      index: this.data.index.copy(),
      name: this.data.name,
      dtype: 'number'
    });
  }

  dayofweek(): Series {
    const result = this.data.values.map(value => {
      const date = this.toDate(value);
      return date ? date.getDay() : NaN;
    });
    
    return new Series(result, {
      index: this.data.index.copy(),
      name: this.data.name,
      dtype: 'number'
    });
  }

  quarter(): Series {
    const result = this.data.values.map(value => {
      const date = this.toDate(value);
      return date ? Math.ceil((date.getMonth() + 1) / 3) : NaN;
    });
    
    return new Series(result, {
      index: this.data.index.copy(),
      name: this.data.name,
      dtype: 'number'
    });
  }

  private toDate(value: any): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }
}

/**
 * Categorical operations
 */
export class Categorical {
  private _categories: any[];
  private _codes: number[];

  constructor(values: any[], categories?: any[]) {
    if (categories) {
      this._categories = [...categories];
    } else {
      this._categories = Array.from(new Set(values.filter(v => !isNull(v))));
    }
    
    this._codes = values.map(value => {
      if (isNull(value)) return -1;
      const index = this._categories.indexOf(value);
      return index >= 0 ? index : -1;
    });
  }

  get categories(): any[] {
    return [...this._categories];
  }

  get codes(): number[] {
    return [...this._codes];
  }

  addCategory(category: any): Categorical {
    if (!this._categories.includes(category)) {
      this._categories.push(category);
    }
    return this;
  }

  removeCategory(category: any): Categorical {
    const index = this._categories.indexOf(category);
    if (index >= 0) {
      this._categories.splice(index, 1);
      // Update codes
      this._codes = this._codes.map(code => {
        if (code === index) return -1;
        if (code > index) return code - 1;
        return code;
      });
    }
    return this;
  }

  toSeries(name?: string): Series {
    const values = this._codes.map(code => 
      code >= 0 ? this._categories[code] : null
    );
    
    return new Series(values, { name });
  }
}