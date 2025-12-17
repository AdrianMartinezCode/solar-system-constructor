/**
 * Simple scatter plot for two-variable data
 */

import React from 'react';
import { ScatterPoint } from '../../utils/stats/computeStats';

export interface ScatterPlotProps {
  data: ScatterPoint[];
  width?: number;
  height?: number;
  color?: string;
  pointRadius?: number;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  showLegend?: boolean;
  legendLabel?: string;
  className?: string;
}

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  width = 300,
  height = 200,
  color = '#4a9eff',
  pointRadius = 3,
  title,
  xLabel,
  yLabel,
  showLegend = false,
  legendLabel,
  className = '',
}) => {
  if (data.length === 0) {
    return (
      <svg width={width} height={height} className={className}>
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#666" fontSize="11">
          No data
        </text>
      </svg>
    );
  }

  const padding = { 
    top: title ? 30 : 15, 
    right: 15, 
    bottom: xLabel ? 40 : 20, 
    left: yLabel ? 50 : 30 
  };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const scaleX = (x: number) => ((x - minX) / rangeX) * chartWidth + padding.left;
  const scaleY = (y: number) => chartHeight - ((y - minY) / rangeY) * chartHeight + padding.top;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <svg width={width} height={height} className={className}>
        {/* Title */}
        {title && (
          <text
            x={width / 2}
            y={20}
            textAnchor="middle"
            fill="#e8e8e8"
            fontSize="12"
            fontWeight="600"
          >
            {title}
          </text>
        )}

        {/* Grid lines */}
        <g opacity={0.2}>
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line
            key={`h-${t}`}
            x1={padding.left}
            y1={scaleY(minY + rangeY * t)}
            x2={width - padding.right}
            y2={scaleY(minY + rangeY * t)}
            stroke="#444"
            strokeWidth={1}
          />
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line
            key={`v-${t}`}
            x1={scaleX(minX + rangeX * t)}
            y1={padding.top}
            x2={scaleX(minX + rangeX * t)}
            y2={height - padding.bottom}
            stroke="#444"
            strokeWidth={1}
          />
        ))}
      </g>

      {/* Axes */}
      <line
        x1={padding.left}
        y1={height - padding.bottom}
        x2={width - padding.right}
        y2={height - padding.bottom}
        stroke="#666"
        strokeWidth={2}
      />
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={height - padding.bottom}
        stroke="#666"
        strokeWidth={2}
      />

      {/* Axis labels */}
      {xLabel && (
        <text
          x={padding.left + chartWidth / 2}
          y={height - 5}
          textAnchor="middle"
          fill="#aaa"
          fontSize="11"
        >
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text
          x={10}
          y={padding.top + chartHeight / 2}
          textAnchor="middle"
          fill="#aaa"
          fontSize="11"
          transform={`rotate(-90, 10, ${padding.top + chartHeight / 2})`}
        >
          {yLabel}
        </text>
      )}

      {/* Tick labels */}
      <g fill="#999" fontSize="9">
        <text x={padding.left - 5} y={height - padding.bottom + 4} textAnchor="end">
          {minY.toFixed(1)}
        </text>
        <text x={padding.left - 5} y={padding.top + 4} textAnchor="end">
          {maxY.toFixed(1)}
        </text>
        <text x={padding.left} y={height - padding.bottom + 15} textAnchor="middle">
          {minX.toFixed(1)}
        </text>
        <text x={width - padding.right} y={height - padding.bottom + 15} textAnchor="middle">
          {maxX.toFixed(1)}
        </text>
      </g>

      {/* Points */}
      {data.map((point, i) => (
        <circle
          key={i}
          cx={scaleX(point.x)}
          cy={scaleY(point.y)}
          r={pointRadius}
          fill={color}
          opacity={0.7}
        >
          {point.label && <title>{point.label}: ({point.x.toFixed(2)}, {point.y.toFixed(2)})</title>}
        </circle>
      ))}
      </svg>

      {/* Legend */}
      {showLegend && legendLabel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', paddingLeft: '8px' }}>
          <svg width="16" height="16">
            <circle cx="8" cy="8" r="4" fill={color} opacity={0.7} />
          </svg>
          <span style={{ color: '#aaa' }}>{legendLabel}</span>
          <span style={{ color: '#777', fontSize: '10px' }}>({data.length} points)</span>
        </div>
      )}
    </div>
  );
};

