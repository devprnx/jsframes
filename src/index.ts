/**
 * JSFrames - A comprehensive JavaScript data analysis library
 * Core module exports
 */

// Core data structures
export { Index } from './core/index';
export { Series } from './core/series';
export { DataFrame } from './core/dataframe';

// I/O Operations
export * from './io';

// Types
export * from './types';

// Utilities
export * from './utils';

// Optional modules (only if dependencies are available)
// Visualization
try {
  const vis = require('./visualization');
  Object.assign(exports, vis);
} catch (e) {
  // Visualization not available
}

// Advanced features
try {
  const advanced = require('./advanced');
  Object.assign(exports, advanced);
} catch (e) {
  // Advanced features not available
}

// Version
export const VERSION = '1.0.0';