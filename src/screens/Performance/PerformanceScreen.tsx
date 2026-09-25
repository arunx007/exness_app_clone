import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Header } from '../../components/common/Header';

export const PerformanceScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Header title="Performance" subtitle="Analytics & Trade History" />
      <View style={{ padding: spacing.lg }}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.lg }]}>
          <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>Trading Summary</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
            Profit factor, win-rate, and detailed volume analytics will appear here.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
  },
});
