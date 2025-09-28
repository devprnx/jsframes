/**
 * Pivot table operations for JSFrames
 */

import { DataFrame } from '../core/dataframe';
import { Series } from '../core/series';
import { Index } from '../core/index';
import { isNull, isNumeric } from '../utils';

export interface PivotOptions {
  index?: string | string[];
  columns: string | string[];
  values?: string | string[];
  aggFunc?: 'sum' | 'mean' | 'count' | 'min' | 'max' | 'first' | 'last';
  fill?: any;
}

/**
 * Create a pivot table from a DataFrame
 */
export function pivot(df: DataFrame, options: PivotOptions): DataFrame {
  const {
    index,
    columns,
    values,
    aggFunc = 'sum',
    fill = null
  } = options;

  // Convert to arrays
  const indexCols = index ? (Array.isArray(index) ? index : [index]) : [];
  const columnCols = Array.isArray(columns) ? columns : [columns];
  const valueCols = values ? (Array.isArray(values) ? values : [values]) : 
    df.columns.toArray().filter(col => 
      !indexCols.includes(col) && 
      !columnCols.includes(col) &&
      df.get(col).dtype === 'number'
    );

  // Validate columns exist
  [...indexCols, ...columnCols, ...valueCols].forEach(col => {
    if (!df.columns.contains(col)) {
      throw new Error(`Column '${col}' not found in DataFrame`);
    }
  });

  // Get unique values for index and columns
  const uniqueIndexValues = indexCols.length > 0 ? 
    getUniqueComboValues(df, indexCols) : ['__single__'];
  const uniqueColumnValues = getUniqueComboValues(df, columnCols);

  // Create result structure
  const resultData: { [key: string]: any[] } = {};
  
  // Add index columns to result
  if (indexCols.length > 0) {
    indexCols.forEach(col => {
      resultData[col] = [];
    });
  }

  // Create column names for pivot columns
  const pivotColumns: string[] = [];
  valueCols.forEach(valueCol => {
    uniqueColumnValues.forEach(colCombo => {
      const colName = valueCols.length > 1 ? 
        `${valueCol}_${colCombo}` : colCombo;
      pivotColumns.push(colName);
      resultData[colName] = [];
    });
  });

  // Build the pivot table
  uniqueIndexValues.forEach(indexCombo => {
    // Add index values to result
    if (indexCols.length > 0) {
      const indexParts = indexCombo.split('|');
      indexCols.forEach((col, i) => {
        const value = indexParts[i];
        resultData[col].push(value === '__null__' ? null : convertValue(value));
      });
    }

    // Calculate pivot values
    valueCols.forEach(valueCol => {
      uniqueColumnValues.forEach(colCombo => {
        const colName = valueCols.length > 1 ? 
          `${valueCol}_${colCombo}` : colCombo;

        // Find matching rows
        const matchingRows = findMatchingRows(df, indexCols, columnCols, indexCombo, colCombo);
        
        if (matchingRows.length === 0) {
          resultData[colName].push(fill);
        } else {
          // Apply aggregation function
          const values = matchingRows.map(rowIdx => df.get(valueCol).iloc(rowIdx))
            .filter(v => !isNull(v));
          
          const aggregatedValue = applyAggregation(values, aggFunc);
          resultData[colName].push(aggregatedValue);
        }
      });
    });
  });

  return new DataFrame(resultData);
}

/**
 * Create a pivot table with multiple index levels
 */
export function pivotTable(df: DataFrame, options: PivotOptions): DataFrame {
  return pivot(df, options);
}

function getUniqueComboValues(df: DataFrame, columns: string[]): string[] {
  const combos = new Set<string>();

  for (let i = 0; i < df.shape[0]; i++) {
    const row = df.iloc(i) as any;
    const combo = columns.map(col => {
      const value = row[col];
      return isNull(value) ? '__null__' : String(value);
    }).join('|');
    combos.add(combo);
  }

  return Array.from(combos).sort();
}

function findMatchingRows(
  df: DataFrame,
  indexCols: string[],
  columnCols: string[],
  indexCombo: string,
  colCombo: string
): number[] {
  const matchingRows: number[] = [];
  const indexParts = indexCombo === '__single__' ? [] : indexCombo.split('|');
  const colParts = colCombo.split('|');

  for (let i = 0; i < df.shape[0]; i++) {
    const row = df.iloc(i) as any;
    
    // Check index match
    let indexMatch = true;
    if (indexCols.length > 0) {
      for (let j = 0; j < indexCols.length; j++) {
        const value = row[indexCols[j]];
        const valueStr = isNull(value) ? '__null__' : String(value);
        if (valueStr !== indexParts[j]) {
          indexMatch = false;
          break;
        }
      }
    }

    // Check column match
    let colMatch = true;
    for (let j = 0; j < columnCols.length; j++) {
      const value = row[columnCols[j]];
      const valueStr = isNull(value) ? '__null__' : String(value);
      if (valueStr !== colParts[j]) {
        colMatch = false;
        break;
      }
    }

    if (indexMatch && colMatch) {
      matchingRows.push(i);
    }
  }

  return matchingRows;
}

function applyAggregation(values: any[], aggFunc: string): any {
  if (values.length === 0) return null;

  const numericValues = values.filter(isNumeric);

  switch (aggFunc) {
    case 'sum':
      return numericValues.reduce((sum, val) => sum + val, 0);
    
    case 'mean':
      return numericValues.length > 0 ? 
        numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length : 
        null;
    
    case 'count':
      return values.length;
    
    case 'min':
      return numericValues.length > 0 ? Math.min(...numericValues) : null;
    
    case 'max':
      return numericValues.length > 0 ? Math.max(...numericValues) : null;
    
    case 'first':
      return values[0];
    
    case 'last':
      return values[values.length - 1];
    
    default:
      throw new Error(`Unknown aggregation function: ${aggFunc}`);
  }
}

function convertValue(str: string): any {
  // Try to convert string back to appropriate type
  if (str === 'true') return true;
  if (str === 'false') return false;
  
  const num = Number(str);
  if (!isNaN(num)) return num;
  
  const date = new Date(str);
  if (!isNaN(date.getTime())) return date;
  
  return str;
}