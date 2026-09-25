import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MarketSymbol } from '../../models';
import { useTheme } from '../../theme';

interface MarketRowProps {
  item: MarketSymbol;
  onPress?: () => void;
}

export const MarketRow: React.FC<MarketRowProps> = ({ item, onPress }) => {
  const { colors, trading, spacing, typography, borderRadius } = useTheme();
  const isPositive = item.change24h >= 0;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.row,
        {
          borderBottomColor: colors.divider,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      <View style={styles.symbolInfo}>
        <Text style={[styles.symbolText, { color: colors.textPrimary, fontSize: typography.sizes.md }]}>
          {item.symbol}
        </Text>
        <Text style={[styles.nameText, { color: colors.textSecondary, fontSize: typography.sizes.xs }]}>
          {item.name}
        </Text>
      </View>

      <View style={styles.priceContainer}>
        <View style={styles.quoteBlock}>
          <Text style={[styles.priceText, { color: colors.textPrimary, fontSize: typography.sizes.base }]}>
            {item.bid.toFixed(item.digits)}
          </Text>
          <Text style={[styles.quoteLabel, { color: colors.textMuted }]}>Bid</Text>
        </View>

        <View style={[styles.quoteBlock, { marginLeft: spacing.lg }]}>
          <Text style={[styles.priceText, { color: colors.textPrimary, fontSize: typography.sizes.base }]}>
            {item.ask.toFixed(item.digits)}
          </Text>
          <Text style={[styles.quoteLabel, { color: colors.textMuted }]}>Ask</Text>
        </View>
      </View>

      <View
        style={[
          styles.changeBadge,
          {
            backgroundColor: isPositive ? trading.buyLight : trading.sellLight,
            borderRadius: borderRadius.sm,
          },
        ]}
      >
        <Text
          style={[
            styles.changeText,
            { color: isPositive ? trading.buy : trading.sell, fontSize: typography.sizes.xs },
          ]}
        >
          {isPositive ? `+${item.change24h}%` : `${item.change24h}%`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  symbolInfo: {
    flex: 1.2,
  },
  symbolText: {
    fontWeight: '700',
  },
  nameText: {
    marginTop: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  quoteBlock: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  quoteLabel: {
    fontSize: 10,
    marginTop: 1,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 62,
    alignItems: 'center',
  },
  changeText: {
    fontWeight: '700',
  },
});
