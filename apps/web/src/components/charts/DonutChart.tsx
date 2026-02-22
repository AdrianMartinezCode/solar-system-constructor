/**
 * Simple donut chart for categorical data breakdown
 */

import React from 'react';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  innerRadius?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 200,
  innerRadius = 0.6,
  showLabels = true,
  showLegend = false,
  className = '',
}) => {
  if (data.length === 0) {
    return (
      <svg width={size} height={size} className={className}>
        <text x={size / 2} y={size / 2} textAnchor="middle" fill="#666" fontSize="11">
          No data
        </text>
      </svg>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size} className={className}>
        <text x={size / 2} y={size / 2} textAnchor="middle" fill="#666" fontSize="11">
          No data
        </text>
      </svg>
    );
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 20;
  const innerR = radius * innerRadius;

  let currentAngle = -90; // Start at top

  const segments = data.map(segment => {
    const percentage = segment.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Calculate arc path
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const x3 = centerX + innerR * Math.cos(endRad);
    const y3 = centerY + innerR * Math.sin(endRad);
    const x4 = centerX + innerR * Math.cos(startRad);
    const y4 = centerY + innerR * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');

    // Label position (middle of arc, outside)
    const midAngle = (startAngle + endAngle) / 2;
    const midRad = (midAngle * Math.PI) / 180;
    const labelRadius = radius + 15;
    const labelX = centerX + labelRadius * Math.cos(midRad);
    const labelY = centerY + labelRadius * Math.sin(midRad);

    return {
      ...segment,
      pathData,
      labelX,
      labelY,
      percentage: (percentage * 100).toFixed(1),
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <svg width={size} height={size} className={className}>
        {/* Segments */}
        {segments.map((segment, i) => (
          <g key={i}>
            <path
              d={segment.pathData}
              fill={segment.color}
              opacity={0.9}
              stroke="#1a1a1a"
              strokeWidth={2}
            />
            {showLabels && parseFloat(segment.percentage) > 5 && (
              <text
                x={segment.labelX}
                y={segment.labelY}
                textAnchor="middle"
                fill="#e8e8e8"
                fontSize="10"
                fontWeight="600"
              >
                {segment.percentage}%
              </text>
            )}
          </g>
        ))}

        {/* Center label */}
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          fill="#e8e8e8"
          fontSize="14"
          fontWeight="700"
        >
          {total}
        </text>
        <text
          x={centerX}
          y={centerY + 16}
          textAnchor="middle"
          fill="#aaa"
          fontSize="10"
        >
          Total
        </text>
      </svg>

      {/* Legend */}
      {showLegend && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: size }}>
          {data.map((segment, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  background: segment.color,
                  borderRadius: '2px',
                }}
              />
              <span style={{ color: '#aaa' }}>{segment.label}</span>
              <span style={{ color: '#e8e8e8', fontWeight: '600' }}>({segment.value})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

