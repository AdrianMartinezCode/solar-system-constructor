/**
 * Simple histogram/bar chart for distribution data
 */

import React from 'react';
import { DistributionBucket } from '../../utils/stats/computeStats';

export interface HistogramProps {
  data: DistributionBucket[];
  width?: number;
  height?: number;
  color?: string;
  showLabels?: boolean;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  className?: string;
}

export const Histogram: React.FC<HistogramProps> = ({
  data,
  width = 300,
  height = 150,
  color = '#4a9eff',
  showLabels = true,
  title,
  xLabel,
  yLabel,
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
    top: title ? 25 : 10, 
    right: 10, 
    bottom: showLabels ? (xLabel ? 45 : 30) : 10, 
    left: yLabel ? 35 : 10 
  };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxCount = Math.max(...data.map(b => b.count), 1);
  const barWidth = chartWidth / data.length;
  const barGap = Math.min(2, barWidth * 0.1);

  return (
    <svg width={width} height={height} className={className}>
      {/* Title */}
      {title && (
        <text
          x={width / 2}
          y={15}
          textAnchor="middle"
          fill="#e8e8e8"
          fontSize="12"
          fontWeight="600"
        >
          {title}
        </text>
      )}

      {/* Y-axis label */}
      {yLabel && (
        <text
          x={10}
          y={padding.top + chartHeight / 2}
          textAnchor="middle"
          fill="#aaa"
          fontSize="10"
          transform={`rotate(-90, 10, ${padding.top + chartHeight / 2})`}
        >
          {yLabel}
        </text>
      )}

      {/* X-axis label */}
      {xLabel && (
        <text
          x={padding.left + chartWidth / 2}
          y={height - 5}
          textAnchor="middle"
          fill="#aaa"
          fontSize="10"
        >
          {xLabel}
        </text>
      )}

      {/* Bars */}
      {data.map((bucket, i) => {
        const barHeight = (bucket.count / maxCount) * chartHeight;
        const x = padding.left + i * barWidth;
        const y = padding.top + chartHeight - barHeight;

        return (
          <g key={i}>
            <rect
              x={x + barGap / 2}
              y={y}
              width={barWidth - barGap}
              height={barHeight}
              fill={color}
              opacity={0.8}
            />
            {bucket.count > 0 && (
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fill="#e8e8e8"
                fontSize="10"
              >
                {bucket.count}
              </text>
            )}
            {showLabels && (
              <text
                x={x + barWidth / 2}
                y={height - 5}
                textAnchor="middle"
                fill="#999"
                fontSize="9"
                transform={`rotate(-45, ${x + barWidth / 2}, ${height - 5})`}
              >
                {bucket.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Baseline */}
      <line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={width - padding.right}
        y2={padding.top + chartHeight}
        stroke="#444"
        strokeWidth={1}
      />
    </svg>
  );
};

