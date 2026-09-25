import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TradingAccount } from '../../models';
import { useTheme } from '../../theme';
import { Button } from '../common/Button';

interface AccountCardProps {
  account: TradingAccount;
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account, onDeposit, onWithdraw }) => {
  const { colors, brand, spacing, borderRadius, typography } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: account.type === 'REAL' ? brand.yellow : colors.surfaceSubtle,
                borderRadius: borderRadius.xs,
              },
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                { color: account.type === 'REAL' ? brand.black : colors.textSecondary },
              ]}
            >
              {account.type}
            </Text>
          </View>
          <Text style={[styles.accountNumber, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
            {account.platform} • {account.accountNumber} • {account.server}
          </Text>
        </View>
        <Text style={[styles.leverage, { color: colors.textMuted }]}>{account.leverage}</Text>
      </View>

      <View style={{ marginTop: spacing.md }}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary, fontSize: typography.sizes.xs }]}>
          Balance
        </Text>
        <Text style={[styles.balanceValue, { color: colors.textPrimary, fontSize: typography.sizes.xxxl }]}>
          {account.currency} {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      <View style={[styles.metricsGrid, { borderTopColor: colors.divider, paddingTop: spacing.md, marginTop: spacing.md }]}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Equity</Text>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            ${account.equity.toFixed(2)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Free Margin</Text>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            ${account.freeMargin.toFixed(2)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Margin Level</Text>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            {account.marginLevel ? `${account.marginLevel}%` : '0.00%'}
          </Text>
        </View>
      </View>

      <View style={[styles.actionsRow, { marginTop: spacing.lg }]}>
        <Button
          title="Deposit"
          variant="primary"
          onPress={onDeposit || (() => {})}
          style={{ flex: 1, marginRight: spacing.sm }}
        />
        <Button
          title="Withdraw"
          variant="outline"
          onPress={onWithdraw || (() => {})}
          style={{ flex: 1, marginLeft: spacing.sm }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  accountNumber: {
    fontSize: 12,
  },
  leverage: {
    fontSize: 12,
  },
  balanceLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontWeight: '800',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
  },
});
