/**
 * Join and merge operations for JSFrames
 */

import { DataFrame } from '../core/dataframe';
import { Index } from '../core/index';
import { JoinOptions } from '../types';
import { isNull } from '../utils';

/**
 * Join/merge two DataFrames
 */
export function merge(
  left: DataFrame,
  right: DataFrame,
  options: JoinOptions = {}
): DataFrame {
  const {
    how = 'inner',
    on,
    leftOn,
    rightOn,
    suffixes = ['_x', '_y']
  } = options;

  // Determine join keys
  let leftKeys: string[];
  let rightKeys: string[];

  if (on) {
    const keys = Array.isArray(on) ? on : [on];
    leftKeys = keys;
    rightKeys = keys;
  } else if (leftOn && rightOn) {
    leftKeys = Array.isArray(leftOn) ? leftOn : [leftOn];
    rightKeys = Array.isArray(rightOn) ? rightOn : [rightOn];
  } else {
    throw new Error('Must specify join keys via "on", or "leftOn" and "rightOn"');
  }

  // Validate join keys exist
  leftKeys.forEach(key => {
    if (!left.columns.contains(key)) {
      throw new Error(`Left join key '${key}' not found in left DataFrame`);
    }
  });

  rightKeys.forEach(key => {
    if (!right.columns.contains(key)) {
      throw new Error(`Right join key '${key}' not found in right DataFrame`);
    }
  });

  // Create join key maps
  const leftKeyMap = createKeyMap(left, leftKeys);
  const rightKeyMap = createKeyMap(right, rightKeys);

  // Get all unique keys based on join type
  const allKeys = getJoinKeys(leftKeyMap, rightKeyMap, how);

  // Build result DataFrame
  const resultData: { [key: string]: any[] } = {};
  const leftColumns = left.columns.toArray();
  const rightColumns = right.columns.toArray();

  // Initialize result columns
  leftColumns.forEach(col => {
    resultData[col] = [];
  });

  rightColumns.forEach(col => {
    let colName = col;
    // Handle column name conflicts
    if (leftColumns.includes(col) && !leftKeys.includes(col)) {
      colName = col + suffixes[1];
    }
    resultData[colName] = [];
  });

  // Perform the join
  for (const key of allKeys) {
    const leftIndices = leftKeyMap.get(key) || [];
    const rightIndices = rightKeyMap.get(key) || [];

    if (leftIndices.length === 0) {
      // Right-only key (for left/outer joins)
      for (const rightIdx of rightIndices) {
        // Add null values for left columns
        leftColumns.forEach(col => {
          resultData[col].push(null);
        });

        // Add right values
        rightColumns.forEach(col => {
          let colName = col;
          if (leftColumns.includes(col) && !leftKeys.includes(col)) {
            colName = col + suffixes[1];
          }
          resultData[colName].push(right.get(col).iloc(rightIdx));
        });
      }
    } else if (rightIndices.length === 0) {
      // Left-only key (for right/outer joins)
      for (const leftIdx of leftIndices) {
        // Add left values
        leftColumns.forEach(col => {
          resultData[col].push(left.get(col).iloc(leftIdx));
        });

        // Add null values for right columns
        rightColumns.forEach(col => {
          let colName = col;
          if (leftColumns.includes(col) && !leftKeys.includes(col)) {
            colName = col + suffixes[1];
          }
          resultData[colName].push(null);
        });
      }
    } else {
      // Matching keys - cartesian product
      for (const leftIdx of leftIndices) {
        for (const rightIdx of rightIndices) {
          // Add left values
          leftColumns.forEach(col => {
            resultData[col].push(left.get(col).iloc(leftIdx));
          });

          // Add right values
          rightColumns.forEach(col => {
            let colName = col;
            if (leftColumns.includes(col) && !leftKeys.includes(col)) {
              colName = col + suffixes[1];
            }
            resultData[colName].push(right.get(col).iloc(rightIdx));
          });
        }
      }
    }
  }

  return new DataFrame(resultData);
}

function createKeyMap(df: DataFrame, keys: string[]): Map<string, number[]> {
  const keyMap = new Map<string, number[]>();

  for (let i = 0; i < df.shape[0]; i++) {
    const row = df.iloc(i) as any;
    const keyValue = keys.map(key => {
      const value = row[key];
      return isNull(value) ? '__null__' : String(value);
    }).join('|');

    if (!keyMap.has(keyValue)) {
      keyMap.set(keyValue, []);
    }
    keyMap.get(keyValue)!.push(i);
  }

  return keyMap;
}

function getJoinKeys(
  leftKeyMap: Map<string, number[]>,
  rightKeyMap: Map<string, number[]>,
  how: 'inner' | 'outer' | 'left' | 'right'
): string[] {
  const leftKeys = new Set(leftKeyMap.keys());
  const rightKeys = new Set(rightKeyMap.keys());

  switch (how) {
    case 'inner':
      return Array.from(leftKeys).filter(key => rightKeys.has(key));

    case 'outer':
      return Array.from(new Set([...leftKeys, ...rightKeys]));

    case 'left':
      return Array.from(leftKeys);

    case 'right':
      return Array.from(rightKeys);

    default:
      throw new Error(`Unknown join type: ${how}`);
  }
}

/**
 * Concatenate DataFrames along rows or columns
 */
export function concat(
  frames: DataFrame[],
  axis: 0 | 1 = 0,
  ignoreIndex = false
): DataFrame {
  if (frames.length === 0) {
    return new DataFrame();
  }

  if (axis === 0) {
    // Concatenate along rows
    return concatRows(frames, ignoreIndex);
  } else {
    // Concatenate along columns
    return concatColumns(frames);
  }
}

function concatRows(frames: DataFrame[], ignoreIndex: boolean): DataFrame {
  // Get all unique columns
  const allColumns = new Set<string>();
  frames.forEach(df => {
    df.columns.toArray().forEach(col => allColumns.add(col));
  });

  const columnList = Array.from(allColumns);
  const resultData: { [key: string]: any[] } = {};

  // Initialize result columns
  columnList.forEach(col => {
    resultData[col] = [];
  });

  // Append data from each DataFrame
  frames.forEach(df => {
    const dfColumns = df.columns.toArray();
    
    for (let i = 0; i < df.shape[0]; i++) {
      columnList.forEach(col => {
        if (dfColumns.includes(col)) {
          resultData[col].push(df.get(col).iloc(i));
        } else {
          resultData[col].push(null);
        }
      });
    }
  });

  // Create result DataFrame
  const options = ignoreIndex ? {} : { 
    index: createConcatenatedIndex(frames) 
  };

  return new DataFrame(resultData, options);
}

function concatColumns(frames: DataFrame[]): DataFrame {
  // All DataFrames must have the same number of rows
  const numRows = frames[0].shape[0];
  if (!frames.every(df => df.shape[0] === numRows)) {
    throw new Error('All DataFrames must have the same number of rows for column concatenation');
  }

  const resultData: { [key: string]: any[] } = {};
  const suffixCounter: { [key: string]: number } = {};

  frames.forEach(df => {
    df.columns.toArray().forEach(col => {
      let colName = col;
      
      // Handle duplicate column names
      if (resultData[colName] !== undefined) {
        suffixCounter[col] = (suffixCounter[col] || 0) + 1;
        colName = `${col}_${suffixCounter[col]}`;
      }
      
      resultData[colName] = df.get(col).values;
    });
  });

  return new DataFrame(resultData, {
    index: frames[0].index.copy()
  });
}

function createConcatenatedIndex(frames: DataFrame[]): Index {
  const indexValues: any[] = [];
  
  frames.forEach(df => {
    indexValues.push(...df.index.toArray());
  });
  
  return new Index(indexValues);
}