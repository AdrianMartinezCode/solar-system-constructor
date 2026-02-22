/**
 * Hook for collecting performance telemetry from R3F
 */

import { useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { collectWebGLStats, WebGLStats } from '../utils/stats/performanceTelemetry';

interface PerformanceTelemetry {
  webglStats: WebGLStats;
}

let globalWebGLStats: WebGLStats = {
  drawCalls: 0,
  triangles: 0,
  points: 0,
  lines: 0,
  geometries: 0,
  textures: 0,
  programs: 0,
};

/**
 * Component to be placed inside Canvas that collects WebGL stats
 */
export function PerformanceTelemetryCollector() {
  const gl = useThree((state) => state.gl);

  useFrame(() => {
    globalWebGLStats = collectWebGLStats(gl);
  });

  return null;
}

/**
 * Hook to access current WebGL stats from outside Canvas
 */
export function usePerformanceTelemetry(): PerformanceTelemetry {
  const [webglStats, setWebglStats] = useState<WebGLStats>(globalWebGLStats);

  useEffect(() => {
    // Poll for updates every 500ms (don't need high frequency for stats display)
    const interval = setInterval(() => {
      setWebglStats({ ...globalWebGLStats });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return {
    webglStats,
  };
}

/**
 * Get current WebGL stats synchronously (for export/copy)
 */
export function getCurrentWebGLStats(): WebGLStats {
  return { ...globalWebGLStats };
}

