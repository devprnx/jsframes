/**
 * Index implementation for JSFrames
 */

import { Index as BaseIndex, DataType, IndexOptions } from '../types';
import { inferArrayDataType, convertToType, arraysEqual, deepClone } from '../utils';

export class Index extends BaseIndex implements ArrayLike<any> {
  private _data: any[];
  private _dtype: DataType;
  private _name?: string;

  constructor(data: any[] = [], options: IndexOptions = {}) {
    super();
    
    this._data = Array.from(data);
    this._dtype = options.dtype || inferArrayDataType(this._data);
    this._name = options.name;
    
    // Convert data to specified type if provided
    if (options.dtype) {
      this._data = this._data.map(value => convertToType(value, this._dtype));
    }
  }

  // ArrayLike implementation
  [index: number]: any;
  
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

  get(index: number): any {
    if (index < 0) {
      index = this._data.length + index;
    }
    // Support ArrayLike interface
    this[index] = this._data[index];
    return this._data[index];
  }

  slice(start = 0, end?: number): Index {
    const slicedData = this._data.slice(start, end);
    return new Index(slicedData, {
      dtype: this._dtype,
      name: this._name
    });
  }

  toArray(): any[] {
    return [...this._data];
  }

  equals(other: Index): boolean {
    if (this.length !== other.length) return false;
    if (this._dtype !== other.dtype) return false;
    
    return arraysEqual(this._data, other.toArray());
  }

  /**
   * Get unique values in the index
   */
  unique(): Index {
    const uniqueValues = Array.from(new Set(this._data));
    return new Index(uniqueValues, {
      dtype: this._dtype,
      name: this._name
    });
  }

  /**
   * Get value counts
   */
  valueCounts(): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    
    for (const value of this._data) {
      const key = String(value);
      counts[key] = (counts[key] || 0) + 1;
    }
    
    return counts;
  }

  /**
   * Check if index contains value
   */
  contains(value: any): boolean {
    return this._data.includes(value);
  }

  /**
   * Find index of value
   */
  indexOf(value: any): number {
    return this._data.indexOf(value);
  }

  /**
   * Append values to index
   */
  append(other: Index | any[]): Index {
    const otherData = other instanceof Index ? other.toArray() : other;
    const newData = [...this._data, ...otherData];
    
    return new Index(newData, {
      dtype: this._dtype,
      name: this._name
    });
  }

  /**
   * Drop values from index
   */
  drop(indices: number[]): Index {
    const newData = this._data.filter((_, i) => !indices.includes(i));
    
    return new Index(newData, {
      dtype: this._dtype,
      name: this._name
    });
  }

  /**
   * Sort index
   */
  sort(ascending = true): Index {
    const sortedData = [...this._data].sort((a, b) => {
      if (a < b) return ascending ? -1 : 1;
      if (a > b) return ascending ? 1 : -1;
      return 0;
    });
    
    return new Index(sortedData, {
      dtype: this._dtype,
      name: this._name
    });
  }

  /**
   * Create a copy of the index
   */
  copy(): Index {
    return new Index(deepClone(this._data), {
      dtype: this._dtype,
      name: this._name
    });
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    const preview = this._data.slice(0, 10);
    const previewStr = preview.map(v => String(v)).join(', ');
    const suffix = this._data.length > 10 ? ', ...' : '';
    
    return `Index([${previewStr}${suffix}], dtype='${this._dtype}', name='${this._name}')`;
  }

  /**
   * Create range index
   */
  static range(start: number, end?: number, step = 1, name?: string): Index {
    if (end === undefined) {
      end = start;
      start = 0;
    }
    
    const data: number[] = [];
    for (let i = start; i < end; i += step) {
      data.push(i);
    }
    
    return new Index(data, { dtype: 'number', name });
  }

  /**
   * Create date range index
   */
  static dateRange(
    start: string | Date,
    end?: string | Date,
    periods?: number,
    freq = 'D',
    name?: string
  ): Index {
    const startDate = new Date(start);
    const data: Date[] = [startDate];
    
    if (periods) {
      for (let i = 1; i < periods; i++) {
        const nextDate = new Date(startDate);
        nextDate.setDate(startDate.getDate() + i);
        data.push(nextDate);
      }
    } else if (end) {
      const endDate = new Date(end);
      const currentDate = new Date(startDate);
      
      while (currentDate < endDate) {
        currentDate.setDate(currentDate.getDate() + 1);
        data.push(new Date(currentDate));
      }
    }
    
    return new Index(data, { dtype: 'date', name });
  }
}