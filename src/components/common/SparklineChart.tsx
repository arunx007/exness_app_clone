import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';

interface SparklineChartProps {
  points: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  points,
  isPositive,
  width = 78,
  height = 28,
}) => {
  if (!points || points.length === 0) {
    return <View style={{ width, height }} />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  // Calculate coordinates
  const stepX = width / (points.length - 1);
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  const coords = points.map((val, idx) => {
    const x = idx * stepX;
    // higher value means smaller Y in SVG
    const y = paddingY + usableHeight - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  // Construct SVG path
  let pathD = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 1; i < coords.length; i++) {
    pathD += ` L ${coords[i].x.toFixed(1)} ${coords[i].y.toFixed(1)}`;
  }

  // Baseline at initial point
  const baselineVal = points[0];
  const baselineY = Math.max(
    paddingY,
    Math.min(
      height - paddingY,
      paddingY + usableHeight - ((baselineVal - min) / range) * usableHeight
    )
  );

  const lineColor = isPositive ? '#2563EB' : '#EF4444';

  return (
    <View style={{ width, height, justifyContent: 'center' }}>
      <Svg width={width} height={height}>
        {/* Dashed Horizontal Baseline representing open */}
        <Line
          x1="0"
          y1={baselineY}
          x2={width}
          y2={baselineY}
          stroke="#94A3B8"
          strokeWidth="0.9"
          strokeDasharray="2, 2.5"
        />

        {/* Live Fluctuating Sparkline */}
        <Path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};
