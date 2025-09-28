/**
 * Streaming data processing for JSFrames
 */

import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, filter, scan, buffer, bufferTime } from 'rxjs/operators';
import { DataFrame } from '../core/dataframe';
import { Series } from '../core/series';

export interface StreamConfig {
  batchSize?: number;
  windowSize?: number;
  bufferTime?: number;
}

export class DataStream {
  private dataSubject = new Subject<any>();
  private config: StreamConfig;
  
  constructor(config: StreamConfig = {}) {
    this.config = {
      batchSize: 1000,
      windowSize: 100,
      bufferTime: 1000,
      ...config
    };
  }
  
  // Stream data as DataFrames
  asDataFrame(): Observable<DataFrame> {
    return this.dataSubject.pipe(
      buffer(this.dataSubject.pipe(bufferTime(this.config.bufferTime!))),
      filter(batch => batch.length > 0),
      map(batch => new DataFrame(batch))
    );
  }
  
  // Stream data with windowing
  windowed(): Observable<DataFrame> {
    return this.dataSubject.pipe(
      scan((acc: any[], curr) => {
        acc.push(curr);
        if (acc.length > this.config.windowSize!) {
          acc.shift();
        }
        return acc;
      }, []),
      map(window => new DataFrame(window))
    );
  }
  
  // Push data to stream
  push(data: any): void {
    this.dataSubject.next(data);
  }
  
  // Complete stream
  complete(): void {
    this.dataSubject.complete();
  }
}

export class StreamingDataFrame {
  private stream: DataStream;
  
  constructor(stream: DataStream) {
    this.stream = stream;
  }
  
  // Apply transformations to streaming data
  transform(fn: (df: DataFrame) => DataFrame): Observable<DataFrame> {
    return this.stream.asDataFrame().pipe(map(fn));
  }
  
  // Filter streaming data
  filter(predicate: (df: DataFrame) => boolean): Observable<DataFrame> {
    return this.stream.asDataFrame().pipe(filter(predicate));
  }
  
  // Aggregate streaming data
  aggregate(fn: (df: DataFrame) => any): Observable<any> {
    return this.stream.asDataFrame().pipe(map(fn));
  }
}

// Factory functions
export function createStream(config?: StreamConfig): DataStream {
  return new DataStream(config);
}

export function fromArray(data: any[], config?: StreamConfig): DataStream {
  const stream = new DataStream(config);
  
  // Use setTimeout to simulate async streaming
  setTimeout(() => {
    data.forEach((item, index) => {
      setTimeout(() => stream.push(item), index * 10);
    });
    setTimeout(() => stream.complete(), data.length * 10 + 100);
  }, 50);
  
  return stream;
}

export function fromWebSocket(url: string, config?: StreamConfig): DataStream {
  const stream = new DataStream(config);
  const ws = new WebSocket(url);
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      stream.push(data);
    } catch (e) {
      console.error('Failed to parse WebSocket data:', e);
    }
  };
  
  ws.onclose = () => stream.complete();
  
  return stream;
}