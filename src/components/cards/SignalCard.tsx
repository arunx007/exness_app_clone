import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, {
  Rect,
  Line,
  Path,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  Polygon,
} from 'react-native-svg';
import { TradingSignalItem } from '../../services/signalsService';

interface SignalCardProps {
  signal: TradingSignalItem;
  onPress?: () => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal, onPress }) => {
  const isBullish = signal.direction === 'bullish';
  const width = 270;
  const height = 96;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.card}
      onPress={onPress}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {signal.name}
        </Text>
        <Text style={styles.timeframe}>{signal.timeframe}</Text>
      </View>

      {/* Date & Time */}
      <Text style={styles.timestamp} numberOfLines={1}>
        {signal.timestamp}
      </Text>

      {/* Indicator line */}
      <Text style={styles.indicatorSubtitle} numberOfLines={1}>
        {signal.subtitle}
      </Text>

      {/* Technical Chart Visual */}
      <View style={styles.chartContainer}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={`bandGrad-${signal.id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FDE8E8" stopOpacity="0.7" />
              <Stop offset="50%" stopColor="#EFF6FF" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#FDE8E8" stopOpacity="0.7" />
            </LinearGradient>
          </Defs>

          {/* Bollinger Band Cloud Shading */}
          <Path
            d={
              isBullish
                ? `M 10 58 Q 60 52, 100 60 T 150 48 T 190 40 L 190 68 Q 150 72, 100 78 T 60 72 T 10 74 Z`
                : `M 10 40 Q 60 36, 100 45 T 150 58 T 190 68 L 190 84 Q 150 78, 100 68 T 60 56 T 10 58 Z`
            }
            fill={`url(#bandGrad-${signal.id})`}
          />

          {/* Green Target Resistance Lines */}
          <Line
            x1="10"
            y1="16"
            x2={width - 55}
            y2="16"
            stroke="#16A34A"
            strokeWidth="1.2"
          />
          <Line
            x1="10"
            y1="25"
            x2={width - 55}
            y2="25"
            stroke="#22C55E"
            strokeWidth="0.9"
            strokeDasharray="3, 3"
          />
          {/* Target Price Badges on right */}
          <Rect x={width - 52} y="10" width="48" height="18" fill="#16A34A" rx="2" />
          <SvgText
            x={width - 28}
            y="23"
            fontSize="9"
            fontWeight="bold"
            fill="#FFFFFF"
            textAnchor="middle"
          >
            {signal.resistanceLevels[0]?.toFixed(2) || 'Target'}
          </SvgText>

          {/* Middle Pivot Lines */}
          <Line
            x1="10"
            y1="48"
            x2={width - 55}
            y2="48"
            stroke="#1E3A8A"
            strokeWidth="1.2"
          />
          <Line
            x1="10"
            y1="56"
            x2={width - 55}
            y2="56"
            stroke="#2563EB"
            strokeWidth="0.9"
            strokeDasharray="3, 3"
          />
          <Rect x={width - 52} y="44" width="48" height="18" fill="#1E3A8A" rx="2" />
          <SvgText
            x={width - 28}
            y="57"
            fontSize="9"
            fontWeight="bold"
            fill="#FFFFFF"
            textAnchor="middle"
          >
            {signal.entryPrice.toFixed(2)}
          </SvgText>

          {/* Red Support Lines */}
          <Line
            x1="10"
            y1="76"
            x2={width - 55}
            y2="76"
            stroke="#DC2626"
            strokeWidth="0.9"
            strokeDasharray="3, 3"
          />
          <Line
            x1="10"
            y1="85"
            x2={width - 55}
            y2="85"
            stroke="#B91C1C"
            strokeWidth="1"
          />
          <SvgText
            x={width - 28}
            y="81"
            fontSize="8"
            fill="#DC2626"
            textAnchor="middle"
          >
            {signal.supportLevels[0]?.toFixed(2) || ''}
          </SvgText>

          {/* Mini Candlestick Bars */}
          {signal.candleData.map((c, i) => {
            const isGreen = c.c >= c.o;
            const barColor = isGreen ? '#22C55E' : '#EF4444';
            const candleTop = 90 - ((Math.max(c.o, c.c) - 170) / 40) * 70;
            const candleBottom = 90 - ((Math.min(c.o, c.c) - 170) / 40) * 70;
            const wickTop = 90 - ((c.h - 170) / 40) * 70;
            const wickBottom = 90 - ((c.l - 170) / 40) * 70;
            const barH = Math.max(candleBottom - candleTop, 2);

            return (
              <React.Fragment key={i}>
                <Line
                  x1={c.x}
                  y1={Math.max(wickTop, 12)}
                  x2={c.x}
                  y2={Math.min(wickBottom, 86)}
                  stroke={barColor}
                  strokeWidth="1"
                />
                <Rect
                  x={c.x - 2.5}
                  y={Math.max(candleTop, 12)}
                  width="5"
                  height={barH}
                  fill={barColor}
                />
              </React.Fragment>
            );
          })}

          {/* Large Directional Projection Arrow */}
          {isBullish ? (
            <>
              <Path
                d="M 130 68 Q 155 52, 185 24"
                stroke="#1D4ED8"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
              />
              <Polygon
                points="180,18 194,22 186,34"
                fill="#1D4ED8"
              />
            </>
          ) : (
            <>
              <Path
                d="M 130 32 Q 155 54, 185 76"
                stroke="#DC2626"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
              />
              <Polygon
                points="186,66 194,78 180,82"
                fill="#DC2626"
              />
            </>
          )}

          {/* Horizontal X Axis Line & Labels */}
          <Line x1="10" y1={height - 2} x2={width - 10} y2={height - 2} stroke="#E2E8F0" strokeWidth="0.8" />
          <SvgText x="35" y={height + 8} fontSize="9" fill="#94A3B8">
            Jul
          </SvgText>
          <SvgText x="95" y={height + 8} fontSize="9" fill="#94A3B8">
            Aug
          </SvgText>
          <SvgText x="155" y={height + 8} fontSize="9" fill="#94A3B8">
            Sep
          </SvgText>
        </Svg>
      </View>

      {/* Target Headline */}
      <Text style={styles.headline} numberOfLines={1}>
        {signal.headline}
      </Text>

      {/* Bottom Footer Row */}
      <View style={styles.footerRow}>
        <View
          style={[
            styles.pill,
            { backgroundColor: isBullish ? '#2563EB' : '#DC2626' },
          ]}
        >
          <Text style={styles.pillText}>{signal.pillLabel}</Text>
        </View>

        <Text style={styles.timeText}>{signal.time}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 290,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginRight: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 6,
  },
  timeframe: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  indicatorSubtitle: {
    fontSize: 9,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  chartContainer: {
    height: 108,
    marginBottom: 8,
    justifyContent: 'center',
  },
  headline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
});
