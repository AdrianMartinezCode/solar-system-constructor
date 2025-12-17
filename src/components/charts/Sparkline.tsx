/**
 * Lightweight sparkline chart for time-series data
 */

import React from 'react';

export interface SparklineProps {
  data: { x: number; y: number }[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  strokeWidth?: number;
  showDots?: boolean;
  title?: string;
  label?: string;
  showMinMax?: boolean;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 200,
  height = 50,
  color = '#4a9eff',
  fillColor = 'rgba(74, 158, 255, 0.1)',
  strokeWidth = 2,
  showDots = false,
  title,
  label,
  showMinMax = false,
  className = '',
}) => {
  if (data.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {(title || label) && (
          <div style={{ fontSize: '11px', color: '#aaa', paddingLeft: '4px' }}>
            {title && <div style={{ fontWeight: '600', color: '#e8e8e8' }}>{title}</div>}
            {label && <div>{label}</div>}
          </div>
        )}
        <svg width={width} height={height} className={className}>
          <text x={width / 2} y={height / 2} textAnchor="middle" fill="#666" fontSize="11">
            No data
          </text>
        </svg>
      </div>
    );
  }

  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Find min/max for scaling
  const yValues = data.map(d => d.y);
  const xValues = data.map(d => d.x);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);

  const rangeY = maxY - minY || 1;
  const rangeX = maxX - minX || 1;

  // Scale functions
  const scaleX = (x: number) => ((x - minX) / rangeX) * chartWidth + padding;
  const scaleY = (y: number) => chartHeight - ((y - minY) / rangeY) * chartHeight + padding;

  // Create path
  const points = data.map((d, i) => {
    const x = scaleX(d.x);
    const y = scaleY(d.y);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Create area fill path
  const areaPath = data.length > 0
    ? `${points} L ${scaleX(data[data.length - 1].x)} ${height - padding} L ${scaleX(data[0].x)} ${height - padding} Z`
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {(title || label) && (
        <div style={{ fontSize: '11px', color: '#aaa', paddingLeft: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {title && <div style={{ fontWeight: '600', color: '#e8e8e8', marginBottom: '2px' }}>{title}</div>}
            {label && <div>{label}</div>}
          </div>
          {showMinMax && (
            <div style={{ fontSize: '10px', color: '#777' }}>
              Min: {minY.toFixed(1)} | Max: {maxY.toFixed(1)}
            </div>
          )}
        </div>
      )}
      
      <svg width={width} height={height} className={className}>
        {/* Area fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill={fillColor}
            stroke="none"
          />
        )}
        
        {/* Line */}
        <path
          d={points}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {showDots && data.map((d, i) => (
          <circle
            key={i}
            cx={scaleX(d.x)}
            cy={scaleY(d.y)}
            r={2}
            fill={color}
          />
        ))}
      </svg>
    </div>
  );
};

