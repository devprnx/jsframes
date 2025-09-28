/**
 * Advanced features for JSFrames
 */

export { 
  DataStream, 
  StreamingDataFrame, 
  StreamConfig,
  createStream, 
  fromArray, 
  fromWebSocket 
} from './streaming';

export { 
  GPUAccelerator, 
  GPUConfig,
  enableGPU, 
  disableGPU, 
  getGPUConfig,
  gpuSum,
  gpuMean,
  gpuMatMul
} from './gpu';

export { 
  Plugin, 
  PluginContext,
  registerPlugin, 
  activatePlugin, 
  deactivatePlugin,
  getPluginRegistry,
  MathPlugin,
  ValidationPlugin
} from './plugins';

export { 
  AsyncDataFrame, 
  AsyncSeries,
  async, 
  asyncSeries,
  asyncChain,
  asyncPipeline
} from './async';