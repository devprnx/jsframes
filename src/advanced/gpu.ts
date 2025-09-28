/**
 * GPU acceleration hooks for JSFrames
 */

import { Matrix } from 'ml-matrix';

export interface GPUConfig {
  enabled: boolean;
  device?: 'cpu' | 'gpu' | 'auto';
  precision?: 'float32' | 'float64';
}

let gpuConfig: GPUConfig = {
  enabled: false,
  device: 'auto',
  precision: 'float32'
};

export class GPUAccelerator {
  private static instance: GPUAccelerator;
  private webgl: WebGL2RenderingContext | null = null;
  
  private constructor() {
    this.initializeWebGL();
  }
  
  static getInstance(): GPUAccelerator {
    if (!GPUAccelerator.instance) {
      GPUAccelerator.instance = new GPUAccelerator();
    }
    return GPUAccelerator.instance;
  }
  
  private initializeWebGL(): void {
    try {
      if (typeof window !== 'undefined') {
        const canvas = document.createElement('canvas');
        this.webgl = canvas.getContext('webgl2');
      }
    } catch (e) {
      console.warn('WebGL2 not available, falling back to CPU');
    }
  }
  
  isAvailable(): boolean {
    return this.webgl !== null;
  }
  
  // GPU-accelerated matrix operations
  async matrixMultiply(a: number[][], b: number[][]): Promise<number[][]> {
    if (!this.isAvailable() || !gpuConfig.enabled) {
      return this.cpuMatrixMultiply(a, b);
    }
    
    // Fallback to CPU for now (WebGL matrix ops would be complex)
    return this.cpuMatrixMultiply(a, b);
  }
  
  private cpuMatrixMultiply(a: number[][], b: number[][]): number[][] {
    const matA = new Matrix(a);
    const matB = new Matrix(b);
    return matA.mmul(matB).to2DArray();
  }
  
  // GPU-accelerated vector operations
  async vectorAdd(a: number[], b: number[]): Promise<number[]> {
    if (!this.isAvailable() || !gpuConfig.enabled) {
      return a.map((val, i) => val + b[i]);
    }
    
    // Fallback to CPU
    return a.map((val, i) => val + b[i]);
  }
  
  async vectorMultiply(a: number[], b: number[]): Promise<number[]> {
    if (!this.isAvailable() || !gpuConfig.enabled) {
      return a.map((val, i) => val * b[i]);
    }
    
    // Fallback to CPU
    return a.map((val, i) => val * b[i]);
  }
  
  // Statistical operations
  async parallelReduce(data: number[], operation: 'sum' | 'mean' | 'max' | 'min'): Promise<number> {
    const chunkSize = Math.ceil(data.length / 4); // Simulate parallelization
    const chunks: number[][] = [];
    
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    
    const chunkResults = await Promise.all(chunks.map(chunk => {
      switch (operation) {
        case 'sum':
          return chunk.reduce((a, b) => a + b, 0);
        case 'mean':
          return chunk.reduce((a, b) => a + b, 0) / chunk.length;
        case 'max':
          return Math.max(...chunk);
        case 'min':
          return Math.min(...chunk);
        default:
          return 0;
      }
    }));
    
    switch (operation) {
      case 'sum':
        return chunkResults.reduce((a, b) => a + b, 0);
      case 'mean':
        return chunkResults.reduce((a, b) => a + b, 0) / chunkResults.length;
      case 'max':
        return Math.max(...chunkResults);
      case 'min':
        return Math.min(...chunkResults);
      default:
        return 0;
    }
  }
}

// Configuration functions
export function enableGPU(config: Partial<GPUConfig> = {}): void {
  gpuConfig = { ...gpuConfig, enabled: true, ...config };
}

export function disableGPU(): void {
  gpuConfig.enabled = false;
}

export function getGPUConfig(): GPUConfig {
  return { ...gpuConfig };
}

// GPU-accelerated operations for DataFrames
export async function gpuSum(values: number[]): Promise<number> {
  const gpu = GPUAccelerator.getInstance();
  return await gpu.parallelReduce(values, 'sum');
}

export async function gpuMean(values: number[]): Promise<number> {
  const gpu = GPUAccelerator.getInstance();
  return await gpu.parallelReduce(values, 'mean');
}

export async function gpuMatMul(a: number[][], b: number[][]): Promise<number[][]> {
  const gpu = GPUAccelerator.getInstance();
  return await gpu.matrixMultiply(a, b);
}