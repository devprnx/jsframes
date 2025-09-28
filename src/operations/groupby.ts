/**
 * GroupBy operations for JSFrames
 */

import { DataFrame } from '../core/dataframe';
import { Series } from '../core/series';
import { Index } from '../core/index';
import { Aggregation, GroupByOptions } from '../types';
import { isNull, isNumeric } from '../utils';

export class DataFrameGroupBy {
  private _df: DataFrame;
  private _groupKeys: string[];
  private _groups: Map<string, number[]>;
  private _options: GroupByOptions;

  constructor(df: DataFrame, by: string | string[], options: GroupByOptions = {}) {
    this._df = df;
    this._groupKeys = Array.isArray(by) ? by : [by];
    this._options = { sort: true, dropna: true, ...options };
    this._groups = new Map();
    
    this._computeGroups();
  }

  private _computeGroups(): void {
    const groupMap = new Map<string, number[]>();
    
    for (let i = 0; i < this._df.shape[0]; i++) {
      const row = this._df.iloc(i) as any;
      const groupKey = this._groupKeys.map(key => {
        const value = row[key];
        return isNull(value) ? '__null__' : String(value);
      }).join('|');
      
      // Skip null groups if dropna is true
      if (this._options.dropna && groupKey.includes('__null__')) {
        continue;
      }
      
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(i);
    }
    
    // Sort groups if requested
    if (this._options.sort) {
      const sortedKeys = Array.from(groupMap.keys()).sort();
      for (const key of sortedKeys) {
        this._groups.set(key, groupMap.get(key)!);
      }
    } else {
      this._groups = groupMap;
    }
  }

  /**
   * Get group keys
   */
  get groups(): string[] {
    return Array.from(this._groups.keys());
  }

  /**
   * Get a specific group
   */
  getGroup(key: string): DataFrame {
    const indices = this._groups.get(key);
    if (!indices) {
      throw new Error(`Group '${key}' not found`);
    }
    
    return this._df.iloc(indices);
  }

  /**
   * Apply aggregation function to all numeric columns
   */
  agg(func: Aggregation | { [column: string]: Aggregation }): DataFrame {
    if (typeof func === 'string' || typeof func === 'function') {
      return this._aggregateAll(func);
    } else {
      return this._aggregateColumns(func);
    }
  }

  private _aggregateAll(func: Aggregation): DataFrame {
    const resultData: { [key: string]: any[] } = {};
    const groupKeys: string[] = [];
    
    // Initialize result structure
    const numericColumns = this._df.columns.toArray().filter(col => {
      const series = this._df.get(col);
      return series.dtype === 'number';
    });
    
    numericColumns.forEach(col => {
      resultData[col] = [];
    });
    
    // Add group key columns
    this._groupKeys.forEach(key => {
      resultData[key] = [];
    });
    
    // Aggregate each group
    for (const [groupKey, indices] of this._groups) {
      const group = this._df.iloc(indices);
      groupKeys.push(groupKey);
      
      // Add group key values
      const firstRow = group.iloc(0) as any;
      this._groupKeys.forEach(key => {
        resultData[key].push(firstRow[key]);
      });
      
      // Aggregate numeric columns
      numericColumns.forEach(col => {
        const series = group.get(col);
        const aggregatedValue = this._applyAggregation(series, func);
        resultData[col].push(aggregatedValue);
      });
    }
    
    return new DataFrame(resultData);
  }

  private _aggregateColumns(funcs: { [column: string]: Aggregation }): DataFrame {
    const resultData: { [key: string]: any[] } = {};
    
    // Initialize result structure
    Object.keys(funcs).forEach(col => {
      resultData[col] = [];
    });
    
    // Add group key columns
    this._groupKeys.forEach(key => {
      resultData[key] = [];
    });
    
    // Aggregate each group
    for (const [groupKey, indices] of this._groups) {
      const group = this._df.iloc(indices);
      
      // Add group key values
      const firstRow = group.iloc(0) as any;
      this._groupKeys.forEach(key => {
        resultData[key].push(firstRow[key]);
      });
      
      // Aggregate specified columns
      Object.entries(funcs).forEach(([col, func]) => {
        if (this._df.columns.contains(col)) {
          const series = group.get(col);
          const aggregatedValue = this._applyAggregation(series, func);
          resultData[col].push(aggregatedValue);
        } else {
          resultData[col].push(null);
        }
      });
    }
    
    return new DataFrame(resultData);
  }

  private _applyAggregation(series: Series, func: Aggregation): any {
    if (typeof func === 'string') {
      switch (func) {
        case 'sum': return series.sum();
        case 'mean': return series.mean();
        case 'median': return series.median();
        case 'min': return series.min();
        case 'max': return series.max();
        case 'std': return series.std();
        case 'var': return Math.pow(series.std(), 2);
        case 'count': return series.count();
        case 'first': return series.length > 0 ? series.iloc(0) : null;
        case 'last': return series.length > 0 ? series.iloc(-1) : null;
        default: throw new Error(`Unknown aggregation function: ${func}`);
      }
    } else if (typeof func === 'function') {
      const values = series.values.filter(v => !isNull(v));
      return func(values);
    } else {
      throw new Error('Invalid aggregation function');
    }
  }

  /**
   * Sum aggregation shortcut
   */
  sum(): DataFrame {
    return this.agg('sum');
  }

  /**
   * Mean aggregation shortcut
   */
  mean(): DataFrame {
    return this.agg('mean');
  }

  /**
   * Count aggregation shortcut
   */
  count(): DataFrame {
    return this.agg('count');
  }

  /**
   * Min aggregation shortcut
   */
  min(): DataFrame {
    return this.agg('min');
  }

  /**
   * Max aggregation shortcut
   */
  max(): DataFrame {
    return this.agg('max');
  }

  /**
   * Size of each group
   */
  size(): Series {
    const sizes: number[] = [];
    const groupKeys: string[] = [];
    
    for (const [key, indices] of this._groups) {
      groupKeys.push(key);
      sizes.push(indices.length);
    }
    
    return new Series(sizes, {
      index: new Index(groupKeys),
      name: 'size'
    });
  }

  /**
   * Apply a function to each group
   */
  apply(func: (group: DataFrame) => any): Series {
    const results: any[] = [];
    const groupKeys: string[] = [];
    
    for (const [key, indices] of this._groups) {
      groupKeys.push(key);
      const group = this._df.iloc(indices);
      results.push(func(group));
    }
    
    return new Series(results, {
      index: new Index(groupKeys),
      name: 'apply'
    });
  }
}