/**
 * File I/O operations for JSFrames
 */

import { DataFrame } from '../core/dataframe';
import { Series } from '../core/series';
import { Index } from '../core/index';
import { ReadOptions } from '../types';

/**
 * CSV Reader/Writer
 */
export class CSVHandler {
  /**
   * Read CSV data from string
   */
  static fromString(csvData: string, options: ReadOptions = {}): DataFrame {
    const lines = csvData.trim().split('\n');
    if (lines.length === 0) return new DataFrame();

    // Parse header
    const header = options.header !== false;
    let columnNames: string[];
    let dataLines: string[];

    if (header && options.header !== 0) {
      // Skip rows if header is a number > 0
      const headerRow = typeof options.header === 'number' ? options.header : 0;
      columnNames = this.parseCsvLine(lines[headerRow]);
      dataLines = lines.slice(headerRow + 1);
    } else if (header) {
      columnNames = this.parseCsvLine(lines[0]);
      dataLines = lines.slice(1);
    } else {
      // No header, create default column names
      const firstLine = this.parseCsvLine(lines[0]);
      columnNames = firstLine.map((_, i) => `col_${i}`);
      dataLines = lines;
    }

    // Apply skiprows
    if (options.skiprows) {
      dataLines = dataLines.slice(options.skiprows);
    }

    // Apply nrows limit
    if (options.nrows) {
      dataLines = dataLines.slice(0, options.nrows);
    }

    // Parse data
    const data: { [key: string]: any[] } = {};
    columnNames.forEach(col => {
      data[col] = [];
    });

    dataLines.forEach(line => {
      const values = this.parseCsvLine(line);
      columnNames.forEach((col, i) => {
        let value = values[i] !== undefined ? values[i] : null;
        
        // Apply dtype conversion
        if (options.dtype && options.dtype[col] && value !== null) {
          value = this.convertValue(value, options.dtype[col]);
        } else if (value !== null) {
          // Auto-detect type
          value = this.autoConvertValue(value);
        }
        
        data[col].push(value);
      });
    });

    // Create index
    let index: Index | undefined;
    if (options.index_col !== undefined) {
      const indexCol = typeof options.index_col === 'number' 
        ? columnNames[options.index_col]
        : options.index_col;
      
      if (indexCol && data[indexCol]) {
        index = new Index(data[indexCol]);
        delete data[indexCol];
      }
    }

    return new DataFrame(data, { index });
  }

  /**
   * Convert DataFrame to CSV string
   */
  static toString(df: DataFrame, includeIndex = true): string {
    const columns = df.columns.toArray();
    let result = '';

    // Header
    if (includeIndex && df.index.name) {
      result += `${df.index.name},`;
    }
    result += columns.join(',') + '\n';

    // Data rows
    for (let i = 0; i < df.shape[0]; i++) {
      const row: string[] = [];
      
      if (includeIndex) {
        row.push(String(df.index.get(i)));
      }
      
      columns.forEach(col => {
        const value = df.get(col).iloc(i);
        row.push(this.formatCsvValue(value));
      });
      
      result += row.join(',') + '\n';
    }

    return result;
  }

  private static parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    result.push(current.trim());
    return result;
  }

  private static formatCsvValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const str = String(value);
    
    // Quote if contains comma, newline, or quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  private static convertValue(value: string, dtype: string): any {
    if (!value || value.toLowerCase() === 'null' || value.toLowerCase() === 'nan') {
      return null;
    }

    switch (dtype) {
      case 'number':
        const num = Number(value);
        return isNaN(num) ? null : num;
      case 'boolean':
        return value.toLowerCase() === 'true' || value === '1';
      case 'date':
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      default:
        return value;
    }
  }

  private static autoConvertValue(value: string): any {
    if (!value || value.toLowerCase() === 'null' || value.toLowerCase() === 'nan') {
      return null;
    }

    // Try number
    if (/^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(value)) {
      return Number(value);
    }

    // Try boolean
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return value.toLowerCase() === 'true';
    }

    // Try date (basic ISO format detection)
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return value;
  }
}

/**
 * JSON Handler
 */
export class JSONHandler {
  /**
   * Read JSON data
   */
  static fromString(jsonData: string): DataFrame {
    try {
      const data = JSON.parse(jsonData);
      
      if (Array.isArray(data)) {
        // Array of objects
        return new DataFrame(data);
      } else if (typeof data === 'object') {
        // Object with column arrays
        return new DataFrame(data);
      } else {
        throw new Error('Invalid JSON format for DataFrame');
      }
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error}`);
    }
  }

  /**
   * Convert DataFrame to JSON
   */
  static toString(df: DataFrame, format: 'records' | 'columns' | 'index' = 'records'): string {
    switch (format) {
      case 'records':
        const records: any[] = [];
        for (let i = 0; i < df.shape[0]; i++) {
          const record: any = {};
          df.columns.toArray().forEach((col: string) => {
            record[col] = df.get(col).iloc(i);
          });
          records.push(record);
        }
        return JSON.stringify(records, null, 2);

      case 'columns':
        const columns: { [key: string]: any[] } = {};
        df.columns.toArray().forEach((col: string) => {
          columns[col] = df.get(col).values;
        });
        return JSON.stringify(columns, null, 2);

      case 'index':
        const indexed: { [key: string]: any } = {};
        for (let i = 0; i < df.shape[0]; i++) {
          const indexKey = String(df.index.get(i));
          const record: any = {};
          df.columns.toArray().forEach((col: string) => {
            record[col] = df.get(col).iloc(i);
          });
          indexed[indexKey] = record;
        }
        return JSON.stringify(indexed, null, 2);

      default:
        throw new Error(`Unsupported JSON format: ${format}`);
    }
  }
}

/**
 * File system utilities (Node.js only)
 */
export class FileSystem {
  /**
   * Check if running in Node.js environment
   */
  static get isNode(): boolean {
    return typeof process !== 'undefined' && process.versions && !!process.versions.node;
  }

  /**
   * Read CSV file (Node.js only)
   */
  static async readCSV(filePath: string, options: ReadOptions = {}): Promise<DataFrame> {
    if (!this.isNode) {
      throw new Error('File operations are only available in Node.js environment');
    }

    const fs = require('fs').promises;
    const csvData = await fs.readFile(filePath, 'utf8');
    return CSVHandler.fromString(csvData, options);
  }

  /**
   * Write CSV file (Node.js only)
   */
  static async writeCSV(df: DataFrame, filePath: string, includeIndex = true): Promise<void> {
    if (!this.isNode) {
      throw new Error('File operations are only available in Node.js environment');
    }

    const fs = require('fs').promises;
    const csvData = CSVHandler.toString(df, includeIndex);
    await fs.writeFile(filePath, csvData, 'utf8');
  }

  /**
   * Read JSON file (Node.js only)
   */
  static async readJSON(filePath: string): Promise<DataFrame> {
    if (!this.isNode) {
      throw new Error('File operations are only available in Node.js environment');
    }

    const fs = require('fs').promises;
    const jsonData = await fs.readFile(filePath, 'utf8');
    return JSONHandler.fromString(jsonData);
  }

  /**
   * Write JSON file (Node.js only)
   */
  static async writeJSON(
    df: DataFrame, 
    filePath: string, 
    format: 'records' | 'columns' | 'index' = 'records'
  ): Promise<void> {
    if (!this.isNode) {
      throw new Error('File operations are only available in Node.js environment');
    }

    const fs = require('fs').promises;
    const jsonData = JSONHandler.toString(df, format);
    await fs.writeFile(filePath, jsonData, 'utf8');
  }
}

// Convenience functions for DataFrame
export function readCSV(source: string, options: ReadOptions = {}): Promise<DataFrame> | DataFrame {
  if (FileSystem.isNode && !source.includes('\n')) {
    // Likely a file path
    return FileSystem.readCSV(source, options);
  } else {
    // CSV data string
    return CSVHandler.fromString(source, options);
  }
}

export function readJSON(source: string): Promise<DataFrame> | DataFrame {
  if (FileSystem.isNode && !source.trim().startsWith('{') && !source.trim().startsWith('[')) {
    // Likely a file path
    return FileSystem.readJSON(source);
  } else {
    // JSON data string
    return JSONHandler.fromString(source);
  }
}