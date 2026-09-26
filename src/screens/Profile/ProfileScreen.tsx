import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, brand, spacing, borderRadius } = useTheme();
  const { user, signOut } = useAuth();

  const settingsItems = [
    { icon: 'shield-checkmark-outline', title: 'Security & 2FA' },
    { icon: 'wallet-outline', title: 'Deposit & Withdrawal Methods' },
    { icon: 'document-text-outline', title: 'Trading Conditions & Spread' },
    { icon: 'headset-outline', title: '24/7 Broker Bros Support' },
  ];

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Trader Account';
  const displayEmail = user?.email || 'support@broker-bros.com';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'BB';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Header title="Profile" subtitle="Account Settings & Verification" />
      <View style={{ padding: spacing.lg }}>
        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.lg }]}>
          <View style={[styles.avatar, { backgroundColor: brand.yellow, borderRadius: borderRadius.full }]}>
            <Text style={{ fontWeight: '800', color: brand.black, fontSize: 18 }}>{initials}</Text>
          </View>
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>{displayName}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{displayEmail}</Text>
          </View>
        </View>

        {/* Settings list */}
        <View style={{ marginTop: spacing.xl }}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.itemRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              <Ionicons name={item.icon as any} size={20} color={colors.textPrimary} />
              <Text style={{ color: colors.textPrimary, flex: 1, marginLeft: spacing.md, fontWeight: '500' }}>
                {item.title}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}

          {/* Log Out Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => signOut()}
            style={[
              styles.itemRow,
              {
                backgroundColor: '#FEF2F2',
                borderColor: '#FCA5A5',
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginTop: spacing.md,
              },
            ]}
          >
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text style={{ color: '#DC2626', flex: 1, marginLeft: spacing.md, fontWeight: '600', fontSize: 15 }}>
              Log out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});
