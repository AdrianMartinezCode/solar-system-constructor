/**
 * Performance telemetry utilities for tracking FPS, frame time, and WebGL stats
 */

export interface PerformanceSnapshot {
  timestamp: number;
  fps: number;
  frameTime: number;
}

export interface WebGLStats {
  drawCalls: number;
  triangles: number;
  points: number;
  lines: number;
  geometries: number;
  textures: number;
  programs: number;
}

/**
 * Rolling buffer for time-series performance data
 */
export class PerformanceBuffer {
  private buffer: PerformanceSnapshot[] = [];
  private maxSize: number;

  constructor(maxSize: number = 180) { // 180 = 3 minutes at 1 sample/sec
    this.maxSize = maxSize;
  }

  add(snapshot: PerformanceSnapshot) {
    this.buffer.push(snapshot);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  clear() {
    this.buffer = [];
  }

  getAll(): PerformanceSnapshot[] {
    return [...this.buffer];
  }

  getLast(count: number): PerformanceSnapshot[] {
    return this.buffer.slice(-count);
  }

  getRange(startTime: number, endTime: number): PerformanceSnapshot[] {
    return this.buffer.filter(
      s => s.timestamp >= startTime && s.timestamp <= endTime
    );
  }

  getStats(): {
    avgFps: number;
    minFps: number;
    maxFps: number;
    avgFrameTime: number;
    p50FrameTime: number;
    p95FrameTime: number;
    p99FrameTime: number;
  } {
    if (this.buffer.length === 0) {
      return {
        avgFps: 0,
        minFps: 0,
        maxFps: 0,
        avgFrameTime: 0,
        p50FrameTime: 0,
        p95FrameTime: 0,
        p99FrameTime: 0,
      };
    }

    const fps = this.buffer.map(s => s.fps);
    const frameTimes = this.buffer.map(s => s.frameTime).sort((a, b) => a - b);

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const percentile = (arr: number[], p: number) => {
      const idx = Math.floor(arr.length * p);
      return arr[Math.min(idx, arr.length - 1)];
    };

    return {
      avgFps: sum(fps) / fps.length,
      minFps: Math.min(...fps),
      maxFps: Math.max(...fps),
      avgFrameTime: sum(frameTimes) / frameTimes.length,
      p50FrameTime: percentile(frameTimes, 0.5),
      p95FrameTime: percentile(frameTimes, 0.95),
      p99FrameTime: percentile(frameTimes, 0.99),
    };
  }
}

/**
 * Global performance buffer singleton
 */
let globalPerfBuffer: PerformanceBuffer | null = null;

export function getGlobalPerformanceBuffer(): PerformanceBuffer {
  if (!globalPerfBuffer) {
    globalPerfBuffer = new PerformanceBuffer(180);
  }
  return globalPerfBuffer;
}

/**
 * FPS measurement utility
 */
export class FPSMeasure {
  private lastTime: number = performance.now();
  private frameCount: number = 0;
  private fpsUpdateTime: number = performance.now();
  private currentFps: number = 60;
  private currentFrameTime: number = 16.7;
  private onUpdate?: (fps: number, frameTime: number) => void;

  constructor(onUpdate?: (fps: number, frameTime: number) => void) {
    this.onUpdate = onUpdate;
  }

  measure(): { fps: number; frameTime: number } {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;
    this.frameCount++;

    this.currentFrameTime = delta;

    // Update FPS every second
    if (now - this.fpsUpdateTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = now;

      if (this.onUpdate) {
        this.onUpdate(this.currentFps, this.currentFrameTime);
      }
    }

    return {
      fps: this.currentFps,
      frameTime: this.currentFrameTime,
    };
  }

  getCurrent(): { fps: number; frameTime: number } {
    return {
      fps: this.currentFps,
      frameTime: this.currentFrameTime,
    };
  }
}

/**
 * WebGL stats collector (to be called from R3F useFrame)
 */
export function collectWebGLStats(gl: any): WebGLStats {
  if (!gl || !gl.info) {
    return {
      drawCalls: 0,
      triangles: 0,
      points: 0,
      lines: 0,
      geometries: 0,
      textures: 0,
      programs: 0,
    };
  }

  const render = gl.info.render;
  const memory = gl.info.memory;

  return {
    drawCalls: render?.calls ?? 0,
    triangles: render?.triangles ?? 0,
    points: render?.points ?? 0,
    lines: render?.lines ?? 0,
    geometries: memory?.geometries ?? 0,
    textures: memory?.textures ?? 0,
    programs: memory?.programs ?? 0,
  };
}

