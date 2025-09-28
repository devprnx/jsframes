/**
 * Basic example demonstrating JSFrames functionality
 */

import { DataFrame, Series, Index } from '../index';

// Create a simple DataFrame
const data = {
  name: ['Alice', 'Bob', 'Charlie', 'Diana'],
  age: [25, 30, 35, 28],
  city: ['New York', 'San Francisco', 'Chicago', 'Boston'],
  salary: [70000, 85000, 95000, 75000]
};

console.log('=== JSFrames Basic Example ===\n');

// Create DataFrame
const df = new DataFrame(data);
console.log('Original DataFrame:');
console.log(df.toString());
console.log('\n');

// Basic operations
console.log('DataFrame shape:', df.shape);
console.log('DataFrame size:', df.size);
console.log('\n');

// Head and tail
console.log('First 2 rows:');
console.log(df.head(2).toString());
console.log('\n');

// Column access
console.log('Age column:');
const ageColumn = df.get('age');
console.log(ageColumn.toString());
console.log('\n');

// Basic statistics
console.log('Age statistics:');
console.log('Mean age:', ageColumn.mean());
console.log('Max age:', ageColumn.max());
console.log('Min age:', ageColumn.min());
console.log('\n');

// Filtering
console.log('People over 30:');
const filtered = df.where((row: any) => row.age > 30);
console.log(filtered.toString());
console.log('\n');

// Sorting
console.log('Sorted by salary (descending):');
const sorted = df.sortValues('salary', false);
console.log(sorted.toString());
console.log('\n');

// Series operations
console.log('=== Series Operations ===');
const numbers = new Series([1, 2, 3, 4, 5, null, 7, 8, 9, 10]);
console.log('Original series:');
console.log(numbers.toString());
console.log('\n');

console.log('Series sum:', numbers.sum());
console.log('Series mean:', numbers.mean());
console.log('Series without nulls:');
console.log(numbers.dropna().toString());
console.log('\n');

// Mathematical operations
console.log('Series * 2:');
console.log(numbers.multiply(2).toString());
console.log('\n');

console.log('=== Example completed successfully! ===');