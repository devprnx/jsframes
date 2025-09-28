/**
 * Plugin system architecture for JSFrames
 */

export interface Plugin {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  activate: (context: PluginContext) => void | Promise<void>;
  deactivate?: () => void | Promise<void>;
}

export interface PluginContext {
  registerDataFrameMethod: (name: string, method: Function) => void;
  registerSeriesMethod: (name: string, method: Function) => void;
  registerIOHandler: (format: string, handler: any) => void;
  registerVisualization: (type: string, renderer: any) => void;
  getConfig: () => any;
  setConfig: (config: any) => void;
}

class PluginRegistry {
  private plugins = new Map<string, Plugin>();
  private activePlugins = new Set<string>();
  private dataFrameMethods = new Map<string, Function>();
  private seriesMethods = new Map<string, Function>();
  private ioHandlers = new Map<string, any>();
  private visualizations = new Map<string, any>();
  private config: any = {};
  
  // Register a plugin
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already registered`);
    }
    
    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Plugin '${plugin.name}' requires dependency '${dep}'`);
        }
      }
    }
    
    this.plugins.set(plugin.name, plugin);
  }
  
  // Activate a plugin
  async activate(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin '${pluginName}' not found`);
    }
    
    if (this.activePlugins.has(pluginName)) {
      return; // Already active
    }
    
    const context: PluginContext = {
      registerDataFrameMethod: (name: string, method: Function) => {
        this.dataFrameMethods.set(name, method);
      },
      registerSeriesMethod: (name: string, method: Function) => {
        this.seriesMethods.set(name, method);
      },
      registerIOHandler: (format: string, handler: any) => {
        this.ioHandlers.set(format, handler);
      },
      registerVisualization: (type: string, renderer: any) => {
        this.visualizations.set(type, renderer);
      },
      getConfig: () => ({ ...this.config }),
      setConfig: (config: any) => {
        this.config = { ...this.config, ...config };
      }
    };
    
    await plugin.activate(context);
    this.activePlugins.add(pluginName);
  }
  
  // Deactivate a plugin
  async deactivate(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin || !this.activePlugins.has(pluginName)) {
      return;
    }
    
    if (plugin.deactivate) {
      await plugin.deactivate();
    }
    
    this.activePlugins.delete(pluginName);
  }
  
  // Get registered methods/handlers
  getDataFrameMethod(name: string): Function | undefined {
    return this.dataFrameMethods.get(name);
  }
  
  getSeriesMethod(name: string): Function | undefined {
    return this.seriesMethods.get(name);
  }
  
  getIOHandler(format: string): any {
    return this.ioHandlers.get(format);
  }
  
  getVisualization(type: string): any {
    return this.visualizations.get(type);
  }
  
  // List plugins
  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }
  
  listActivePlugins(): string[] {
    return Array.from(this.activePlugins);
  }
  
  // Plugin info
  getPluginInfo(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName);
  }
}

// Global plugin registry
const globalRegistry = new PluginRegistry();

// Export functions
export function registerPlugin(plugin: Plugin): void {
  globalRegistry.register(plugin);
}

export async function activatePlugin(pluginName: string): Promise<void> {
  await globalRegistry.activate(pluginName);
}

export async function deactivatePlugin(pluginName: string): Promise<void> {
  await globalRegistry.deactivate(pluginName);
}

export function getPluginRegistry(): PluginRegistry {
  return globalRegistry;
}

// Built-in plugin examples
export const MathPlugin: Plugin = {
  name: 'math-extensions',
  version: '1.0.0',
  description: 'Advanced mathematical operations',
  activate: (context) => {
    context.registerDataFrameMethod('zscore', function(this: any) {
      // Z-score normalization for all numeric columns
      const result: { [key: string]: number[] } = {};
      
      for (const col of this.columns.toArray()) {
        const series = this.get(col);
        if (series.dtype === 'number') {
          const mean = series.mean();
          const std = series.std();
          result[col] = series.values.map((v: number) => (v - mean) / std);
        } else {
          result[col] = series.values;
        }
      }
      
      const DataFrame = require('../core/dataframe').DataFrame;
      return new DataFrame(result, { index: this.index.copy() });
    });
    
    context.registerSeriesMethod('zscore', function(this: any) {
      const mean = this.mean();
      const std = this.std();
      const Series = require('../core/series').Series;
      return new Series(
        this.values.map((v: number) => (v - mean) / std),
        { index: this.index.copy(), name: `${this.name}_zscore` }
      );
    });
  }
};

export const ValidationPlugin: Plugin = {
  name: 'data-validation',
  version: '1.0.0',
  description: 'Data quality and validation tools',
  activate: (context) => {
    context.registerDataFrameMethod('validate', function(this: any, rules: any) {
      const errors: string[] = [];
      
      for (const [column, rule] of Object.entries(rules)) {
        if (!this.columns.contains(column)) {
          errors.push(`Column '${column}' not found`);
          continue;
        }
        
        const series = this.get(column);
        // Add validation logic here
        
      }
      
      return { valid: errors.length === 0, errors };
    });
  }
};