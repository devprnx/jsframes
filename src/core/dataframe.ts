/**
 * DataFrame implementation for JSFrames (Clean version without duplicates)
 */

import { BaseFrame, DataType, DataFrameOptions, JoinOptions, Aggregation } from '../types';
import { Index } from './index';
import { Series } from './series';
import { 
  inferArrayDataType, 
  convertToType, 
  isNull, 
  isNumeric,
  range,
  deepClone 
} from '../utils';

export class DataFrame extends BaseFrame {
  private _data: { [column: string]: any[] };
  private _index: Index;
  private _columns: Index;

  constructor(data: any[][] | { [key: string]: any[] } | any[] = [], options: DataFrameOptions = {}) {
    super();
    
    this._data = {};
    
    // Handle different input formats
    if (Array.isArray(data)) {
      if (data.length === 0) {
        // Empty DataFrame
        this._columns = new Index([]);
        this._index = new Index([]);
      } else if (Array.isArray(data[0])) {
        // 2D array format
        const array2d = data as any[][];
        const numCols = array2d[0]?.length || 0;
        const numRows = array2d.length;
        
        // Create column names
        const columnNames = options.columns 
          ? (options.columns instanceof Index ? options.columns.toArray() : options.columns)
          : range(numCols).map(i => String(i));
        
        this._columns = new Index(Array.isArray(columnNames) ? columnNames : []);
        
        // Initialize columns
        const columnArray = Array.isArray(columnNames) ? columnNames : [];
        columnArray.forEach((col: string, colIndex: number) => {
          this._data[col] = array2d.map(row => row[colIndex] !== undefined ? row[colIndex] : null);
        });
        
        // Create index
        this._index = options.index 
          ? (options.index instanceof Index ? options.index : new Index(options.index as any[]))
          : Index.range(numRows);
          
      } else {
        // Array of objects
        const objects = data as any[];
        const allKeys = new Set<string>();
        objects.forEach(obj => {
          if (obj && typeof obj === 'object') {
            Object.keys(obj).forEach(key => allKeys.add(key));
          }
        });
        
        const columnNames = Array.from(allKeys);
        this._columns = new Index(columnNames);
        
        // Initialize columns
        columnNames.forEach(col => {
          this._data[col] = objects.map(obj => obj && obj[col] !== undefined ? obj[col] : null);
        });
        
        // Create index
        this._index = options.index 
          ? (options.index instanceof Index ? options.index : new Index(options.index as any[]))
          : Index.range(objects.length);
      }
    } else {
      // Object format: { column: [values] }
      const objData = data as { [key: string]: any[] };
      const columnNames = Object.keys(objData);
      
      if (columnNames.length === 0) {
        this._columns = new Index([]);
        this._index = new Index([]);
      } else {
        this._columns = new Index(columnNames);
        
        // Find the maximum length to ensure all columns have the same length
        const maxLength = Math.max(...columnNames.map(col => objData[col]?.length || 0));
        
        // Initialize columns, padding with null if necessary
        columnNames.forEach(col => {
          const colData = objData[col] || [];
          this._data[col] = [...colData];
          // Pad with nulls if shorter than maxLength
          while (this._data[col].length < maxLength) {
            this._data[col].push(null);
          }
        });
        
        // Create index
        this._index = options.index 
          ? (options.index instanceof Index ? options.index : new Index(options.index as any[]))
          : Index.range(maxLength);
      }
    }
    
    // Validate index length
    if (this._index.length > 0 && this._columns.length > 0) {
      const dataLength = this._data[this._columns.get(0)]?.length || 0;
      if (this._index.length !== dataLength) {
        throw new Error(`Index length (${this._index.length}) does not match data length (${dataLength})`);
      }
    }
  }

  get shape(): [number, number] {
    return [this._index.length, this._columns.length];
  }

  get size(): number {
    return this._index.length * this._columns.length;
  }

  get empty(): boolean {
    return this._index.length === 0 || this._columns.length === 0;
  }

  get index(): Index {
    return this._index;
  }

  get columns(): Index {
    return this._columns;
  }

  get values(): any[][] {
    const result: any[][] = [];
    
    for (let i = 0; i < this._index.length; i++) {
      const row: any[] = [];
      for (let j = 0; j < this._columns.length; j++) {
        const col = this._columns.get(j);
        row.push(this._data[col][i]);
      }
      result.push(row);
    }
    
    return result;
  }

  // Column access
  get(column: string): Series {
    if (!this._columns.contains(column)) {
      throw new Error(`Column '${column}' not found`);
    }
    
    return new Series(this._data[column], {
      index: this._index.copy(),
      name: column
    });
  }

  // Multiple column access
  select(columns: string[]): DataFrame {
    const selectedData: { [key: string]: any[] } = {};
    
    columns.forEach(col => {
      if (!this._columns.contains(col)) {
        throw new Error(`Column '${col}' not found`);
      }
      selectedData[col] = [...this._data[col]];
    });
    
    return new DataFrame(selectedData, {
      index: this._index.copy()
    });
  }

  // Row access by position
  iloc(index: number | number[]): any | DataFrame {
    if (typeof index === 'number') {
      if (index < 0) index = this._index.length + index;
      
      const row: { [key: string]: any } = {};
      this._columns.toArray().forEach((col: string) => {
        row[col] = this._data[col][index as number];
      });
      
      return row;
    }
    
    // Multiple rows
    const selectedData: { [key: string]: any[] } = {};
    const selectedIndexData: any[] = [];
    
    this._columns.toArray().forEach(col => {
      selectedData[col] = index.map(i => {
        const adjustedIndex = i < 0 ? this._index.length + i : i;
        return this._data[col][adjustedIndex];
      });
    });
    
    index.forEach(i => {
      const adjustedIndex = i < 0 ? this._index.length + i : i;
      selectedIndexData.push(this._index.get(adjustedIndex));
    });
    
    return new DataFrame(selectedData, {
      index: new Index(selectedIndexData)
    });
  }

  // Row access by label
  loc(label: any | any[]): any | DataFrame {
    if (Array.isArray(label)) {
      const indices = label.map(l => this._index.indexOf(l)).filter(i => i !== -1);
      return this.iloc(indices);
    }
    
    const index = this._index.indexOf(label);
    if (index === -1) {
      throw new Error(`Label ${label} not found in index`);
    }
    
    return this.iloc(index);
  }

  // Basic operations
  head(n = 5): any {
    const indices = range(Math.min(n, this._index.length));
    return this.iloc(indices);
  }

  tail(n = 5): any {
    const startIndex = Math.max(0, this._index.length - n);
    const indices = range(startIndex, this._index.length);
    return this.iloc(indices);
  }

  copy(): any {
    const copiedData: { [key: string]: any[] } = {};
    
    this._columns.toArray().forEach(col => {
      copiedData[col] = deepClone(this._data[col]);
    });
    
    return new DataFrame(copiedData, {
      index: this._index.copy()
    });
  }

  equals(other: any): boolean {
    if (this.shape[0] !== other.shape[0] || this.shape[1] !== other.shape[1]) {
      return false;
    }
    
    if (!this._index.equals(other.index) || !this._columns.equals(other.columns)) {
      return false;
    }
    
    for (const col of this._columns.toArray()) {
      for (let i = 0; i < this._index.length; i++) {
        if (this._data[col][i] !== other.get(col).iloc(i)) {
          return false;
        }
      }
    }
    
    return true;
  }

  // Filtering
  where(condition: (row: any, index: number) => boolean): DataFrame {
    const filteredIndices: number[] = [];
    
    for (let i = 0; i < this._index.length; i++) {
      const row = this.iloc(i);
      if (condition(row, i)) {
        filteredIndices.push(i);
      }
    }
    
    return this.iloc(filteredIndices);
  }

  // Null handling
  isNull(): DataFrame {
    const nullData: { [key: string]: boolean[] } = {};
    
    this._columns.toArray().forEach(col => {
      nullData[col] = this._data[col].map(value => isNull(value));
    });
    
    return new DataFrame(nullData, {
      index: this._index.copy()
    });
  }

  dropna(how: 'any' | 'all' = 'any'): DataFrame {
    const filteredIndices: number[] = [];
    
    for (let i = 0; i < this._index.length; i++) {
      const row = this._columns.toArray().map(col => this._data[col][i]);
      const nullCount = row.filter(isNull).length;
      
      if (how === 'any' && nullCount === 0) {
        filteredIndices.push(i);
      } else if (how === 'all' && nullCount < row.length) {
        filteredIndices.push(i);
      }
    }
    
    return this.iloc(filteredIndices);
  }

  fillna(value: any): DataFrame {
    const filledData: { [key: string]: any[] } = {};
    
    this._columns.toArray().forEach(col => {
      filledData[col] = this._data[col].map(v => isNull(v) ? value : v);
    });
    
    return new DataFrame(filledData, {
      index: this._index.copy()
    });
  }

  // Column operations
  drop(columns: string | string[]): DataFrame {
    const columnsToDrop = Array.isArray(columns) ? columns : [columns];
    const remainingColumns = this._columns.toArray().filter(col => !columnsToDrop.includes(col));
    
    return this.select(remainingColumns);
  }

  rename(mapping: { [oldName: string]: string }): DataFrame {
    const renamedData: { [key: string]: any[] } = {};
    
    this._columns.toArray().forEach(col => {
      const newName = mapping[col] || col;
      renamedData[newName] = [...this._data[col]];
    });
    
    return new DataFrame(renamedData, {
      index: this._index.copy()
    });
  }

  // Aggregation methods
  sum(): Series {
    const sums: any[] = [];
    const columnNames: string[] = [];
    
    this._columns.toArray().forEach(col => {
      const numericValues = this._data[col].filter(isNumeric);
      const sum = numericValues.reduce((acc, val) => acc + val, 0);
      sums.push(sum);
      columnNames.push(col);
    });
    
    return new Series(sums, {
      index: new Index(columnNames),
      name: 'sum'
    });
  }

  mean(): Series {
    const means: any[] = [];
    const columnNames: string[] = [];
    
    this._columns.toArray().forEach(col => {
      const numericValues = this._data[col].filter(isNumeric);
      const mean = numericValues.length > 0 
        ? numericValues.reduce((acc, val) => acc + val, 0) / numericValues.length 
        : NaN;
      means.push(mean);
      columnNames.push(col);
    });
    
    return new Series(means, {
      index: new Index(columnNames),
      name: 'mean'
    });
  }

  count(): Series {
    const counts: any[] = [];
    const columnNames: string[] = [];
    
    this._columns.toArray().forEach(col => {
      const count = this._data[col].filter(v => !isNull(v)).length;
      counts.push(count);
      columnNames.push(col);
    });
    
    return new Series(counts, {
      index: new Index(columnNames),
      name: 'count'
    });
  }

  describe(): DataFrame {
    const stats = ['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'];
    const result: { [key: string]: any[] } = {};
    
    // Initialize result structure
    stats.forEach(stat => {
      result[stat] = [];
    });
    
    const numericColumns: string[] = [];
    
    this._columns.toArray().forEach(col => {
      const series = this.get(col);
      if (series.dtype === 'number') {
        numericColumns.push(col);
        const description = series.describe();
        
        stats.forEach(stat => {
          result[stat].push(description[stat] || NaN);
        });
      }
    });
    
    return new DataFrame(result, {
      index: new Index(numericColumns)
    });
  }

  // Sorting
  sortValues(by: string | string[], ascending = true): DataFrame {
    const columns = Array.isArray(by) ? by : [by];
    
    // Validate columns exist
    columns.forEach(col => {
      if (!this._columns.contains(col)) {
        throw new Error(`Column '${col}' not found`);
      }
    });
    
    const indices = range(this._index.length);
    
    indices.sort((i, j) => {
      for (const col of columns) {
        const a = this._data[col][i];
        const b = this._data[col][j];
        
        if (isNull(a) && isNull(b)) continue;
        if (isNull(a)) return 1;
        if (isNull(b)) return -1;
        
        if (a < b) return ascending ? -1 : 1;
        if (a > b) return ascending ? 1 : -1;
      }
      
      return 0;
    });
    
    return this.iloc(indices);
  }

  // Advanced operations
  groupby(by: string | string[]): any {
    const { DataFrameGroupBy } = require('../operations/groupby');
    return new DataFrameGroupBy(this, by);
  }

  merge(other: DataFrame, options: any = {}): DataFrame {
    const { merge } = require('../operations/joins');
    return merge(this, other, options);
  }

  pivot(index: string, columns: string, values: string): DataFrame {
    const { pivot } = require('../operations/pivot');
    return pivot(this, { index, columns, values });
  }

  // Additional utility methods
  apply(func: (values: any[]) => any, axis: 0 | 1 = 1): any {
    if (axis === 1) {
      // Apply function to each row
      const result: any[] = [];
      for (let i = 0; i < this._index.length; i++) {
        const row = this._columns.toArray().map(col => this._data[col][i]);
        result.push(func(row));
      }
      return new Series(result, { index: this._index.copy() });
    } else {
      // Apply function to each column
      const result: { [key: string]: any } = {};
      this._columns.toArray().forEach(col => {
        result[col] = func(this._data[col]);
      });
      return result;
    }
  }

  assign(newColumns: { [columnName: string]: any[] | ((df: DataFrame) => any[]) }): DataFrame {
    const newData = { ...this._data };
    
    Object.entries(newColumns).forEach(([colName, values]) => {
      if (typeof values === 'function') {
        newData[colName] = values(this);
      } else {
        if (values.length !== this._index.length) {
          throw new Error(`Length of values (${values.length}) does not match DataFrame length (${this._index.length})`);
        }
        newData[colName] = [...values];
      }
    });
    
    const updatedColumns = [...this._columns.toArray(), ...Object.keys(newColumns)];
    
    return new DataFrame(newData, {
      index: this._index.copy(),
      columns: updatedColumns
    });
  }

  getDummies(columns: string[]): DataFrame {
    const dummyData: { [key: string]: any[] } = {};
    
    // Keep original columns that are not being dummified
    const keepColumns = this._columns.toArray().filter(col => !columns.includes(col));
    keepColumns.forEach(col => {
      dummyData[col] = [...this._data[col]];
    });
    
    // Create dummy variables for specified columns
    columns.forEach(col => {
      if (!this._columns.contains(col)) {
        throw new Error(`Column '${col}' not found`);
      }
      
      const uniqueValues = [...new Set(this._data[col].filter(v => !isNull(v)))];
      
      uniqueValues.forEach(value => {
        const dummyColName = `${col}_${value}`;
        dummyData[dummyColName] = this._data[col].map(v => v === value ? 1 : 0);
      });
    });
    
    return new DataFrame(dummyData, {
      index: this._index.copy()
    });
  }

  sample(n: number, random_state?: number): DataFrame {
    if (random_state !== undefined) {
      // Simple seeded random (not cryptographically secure)
      Math.random = (() => {
        let seed = random_state;
        return () => {
          seed = (seed * 9301 + 49297) % 233280;
          return seed / 233280;
        };
      })();
    }
    
    const sampleSize = Math.min(n, this._index.length);
    const indices = range(this._index.length);
    
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    return this.iloc(indices.slice(0, sampleSize));
  }

  // Plotting functionality
  get plot(): any {
    const { DataFramePlotter } = require('../visualization/dataframe-plotter');
    return new DataFramePlotter(this);
  }

  // String representation
  toString(): string {
    const maxRows = 10;
    const maxCols = 5;
    
    const displayRows = Math.min(this._index.length, maxRows);
    const displayCols = Math.min(this._columns.length, maxCols);
    
    let result = '     ';
    
    // Column headers
    for (let j = 0; j < displayCols; j++) {
      result += `${this._columns.get(j).toString().padEnd(10)} `;
    }
    if (this._columns.length > maxCols) {
      result += '...';
    }
    result += '\n';
    
    // Data rows
    for (let i = 0; i < displayRows; i++) {
      result += `${this._index.get(i).toString().padEnd(5)} `;
      
      for (let j = 0; j < displayCols; j++) {
        const col = this._columns.get(j);
        const value = this._data[col][i];
        const valueStr = value !== null && value !== undefined ? value.toString() : 'NaN';
        result += `${valueStr.padEnd(10)} `;
      }
      
      if (this._columns.length > maxCols) {
        result += '...';
      }
      result += '\n';
    }
    
    if (this._index.length > maxRows) {
      result += '...\n';
    }
    
    result += `\n[${this._index.length} rows x ${this._columns.length} columns]`;
    
    return result;
  }

  /**
   * Read CSV data with advanced options
   */
  static readCSVAdvanced(csvData: string, options: {
    delimiter?: string;
    header?: boolean;
    skipRows?: number;
    columns?: string[];
    dtypes?: Record<string, string>;
    parseOptions?: {
      parseNumbers?: boolean;
      parseDates?: boolean;
      dateFormat?: string;
    };
  } = {}): DataFrame {
    const {
      delimiter = ',',
      header = true,
      skipRows = 0,
      columns,
      dtypes = {},
      parseOptions = { parseNumbers: true, parseDates: true }
    } = options;

    const lines = csvData.split('\n').slice(skipRows).filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('No data found in CSV');
    }

    let headers: string[];
    let dataLines: string[];

    if (header) {
      headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
      dataLines = lines.slice(1);
    } else {
      headers = columns || lines[0].split(delimiter).map((_, i) => `col_${i}`);
      dataLines = lines;
    }

    const data: Record<string, any[]> = {};
    headers.forEach(h => data[h] = []);

    dataLines.forEach(line => {
      const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
      headers.forEach((header, index) => {
        let value: any = values[index] || null;
        
        // Apply data type parsing
        if (value !== null && value !== '') {
          const dtype = dtypes[header];
          if (dtype === 'number' || (parseOptions.parseNumbers && !isNaN(Number(value)))) {
            value = Number(value);
          } else if (dtype === 'boolean') {
            value = value.toLowerCase() === 'true';
          } else if (dtype === 'date' || (parseOptions.parseDates && DataFrame.isDateString(value))) {
            value = new Date(value);
          }
        }
        
        data[header].push(value);
      });
    });

    return new DataFrame(data);
  }

  private static isDateString(value: string): boolean {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/,        // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/,          // MM-DD-YYYY
      /^\d{4}\/\d{2}\/\d{2}$/,        // YYYY/MM/DD
    ];
    return datePatterns.some(pattern => pattern.test(value)) && !isNaN(Date.parse(value));
  }

  /**
   * Calculate correlation matrix
   */
  correlation(method: 'pearson' | 'spearman' = 'pearson'): DataFrame {
    const numericColumns = this.columns.toArray().filter(col => {
      const series = this.get(col);
      return series.values.some(v => typeof v === 'number' && !isNaN(v));
    });

    if (numericColumns.length < 2) {
      throw new Error('Need at least 2 numeric columns for correlation');
    }

    const correlationData: Record<string, number[]> = {};
    numericColumns.forEach(col => correlationData[col] = []);

    numericColumns.forEach(col1 => {
      numericColumns.forEach(col2 => {
        const series1 = this.get(col1).dropna();
        const series2 = this.get(col2).dropna();
        
        let corr: number;
        if (method === 'pearson') {
          corr = this.pearsonCorrelation(series1.values, series2.values);
        } else {
          corr = this.spearmanCorrelation(series1.values, series2.values);
        }
        
        correlationData[col1].push(corr);
      });
    });

    return new DataFrame(correlationData, { index: new Index(numericColumns) });
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length) return NaN;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private spearmanCorrelation(x: number[], y: number[]): number {
    const rankX = this.getRanks(x);
    const rankY = this.getRanks(y);
    return this.pearsonCorrelation(rankX, rankY);
  }

  private getRanks(values: number[]): number[] {
    const sorted = values.map((value, index) => ({ value, index }))
                        .sort((a, b) => a.value - b.value);
    const ranks = new Array(values.length);
    
    for (let i = 0; i < sorted.length; i++) {
      ranks[sorted[i].index] = i + 1;
    }
    
    return ranks;
  }

  /**
   * Data validation methods
   */
  validateData(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for empty DataFrame
    if (this.shape[0] === 0) {
      errors.push('DataFrame is empty');
    }
    
    // Check for consistent column lengths
    const lengths = this.columns.toArray().map(col => this._data[col].length);
    const uniqueLengths = [...new Set(lengths)];
    if (uniqueLengths.length > 1) {
      errors.push('Columns have inconsistent lengths');
    }
    
    // Check for excessive null values
    this.columns.toArray().forEach(col => {
      const series = this.get(col);
      const nullCount = series.values.filter(v => v == null).length;
      const nullPercentage = (nullCount / series.length) * 100;
      if (nullPercentage > 50) {
        errors.push(`Column '${col}' has ${nullPercentage.toFixed(1)}% null values`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Memory usage information
   */
  memoryUsage(): Record<string, number> {
    const usage: Record<string, number> = {};
    
    this.columns.toArray().forEach(col => {
      const series = this.get(col);
      // Rough estimation of memory usage
      const avgStringLength = 10; // assumption for strings
      const bytesPerValue = series.dtype === 'string' ? avgStringLength : 8;
      usage[col] = series.length * bytesPerValue;
    });
    
    usage['total'] = Object.values(usage).reduce((a, b) => a + b, 0);
    return usage;
  }

  /**
   * Export to different formats with options
   */
  toCSVAdvanced(options: {
    delimiter?: string;
    includeIndex?: boolean;
    header?: boolean;
    columns?: string[];
    quoting?: 'minimal' | 'all' | 'none';
  } = {}): string {
    const {
      delimiter = ',',
      includeIndex = false,
      header = true,
      columns = this.columns.toArray(),
      quoting = 'minimal'
    } = options;

    let result = '';
    
    // Header row
    if (header) {
      const headers = includeIndex ? [''] : [];
      headers.push(...columns);
      
      if (quoting === 'all') {
        result += headers.map(h => `"${h}"`).join(delimiter) + '\n';
      } else {
        result += headers.join(delimiter) + '\n';
      }
    }
    
    // Data rows
    for (let i = 0; i < this.shape[0]; i++) {
      const row: string[] = [];
      
      if (includeIndex) {
        row.push(this._index.get(i).toString());
      }
      
      columns.forEach(col => {
        const value = this._data[col][i];
        let valueStr = value !== null && value !== undefined ? value.toString() : '';
        
        // Apply quoting rules
        if (quoting === 'all' || (quoting === 'minimal' && valueStr.includes(delimiter))) {
          valueStr = `"${valueStr.replace(/"/g, '""')}"`;
        }
        
        row.push(valueStr);
      });
      
      result += row.join(delimiter) + '\n';
    }
    
    return result;
  }
}