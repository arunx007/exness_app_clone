import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export const PerformanceScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();

  const [selectedAccountFilter, setSelectedAccountFilter] = useState('All real accounts');
  const [selectedPeriod, setSelectedPeriod] = useState('Last 7 days');

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0B0E14' : '#FFFFFF', paddingTop: insets.top + 16 }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Main Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>
          Performance
        </Text>

        {/* UTC Time Notice (media_1790410113393.jpg) */}
        <View style={styles.noticeRow}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={isDark ? '#9CA3AF' : '#6B7280'}
            style={styles.noticeIcon}
          />
          <Text style={[styles.noticeText, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>
            All times on this page use UTC (GMT+0) and may differ from your local time
          </Text>
        </View>
      </View>

      {/* Thin Horizontal Divider */}
      <View style={[styles.divider, { backgroundColor: isDark ? '#1E2432' : '#F3F4F6' }]} />

      {/* Filter Capsules Row */}
      <View style={styles.filtersRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.filterCapsule, { backgroundColor: isDark ? '#1E2330' : '#F3F4F6' }]}
        >
          <Text style={[styles.filterText, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>
            {selectedAccountFilter}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={isDark ? '#E5E7EB' : '#1F2937'}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.filterCapsule, { backgroundColor: isDark ? '#1E2330' : '#F3F4F6' }]}
        >
          <Ionicons
            name="calendar-outline"
            size={15}
            color={isDark ? '#E5E7EB' : '#1F2937'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.filterText, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>
            {selectedPeriod}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Center Empty State (Exact 1:1 with media_1790410113393.jpg) */}
      <View style={styles.emptyStateContainer}>
        {/* Warning Triangle Icon */}
        <View style={styles.iconWrapper}>
          <Ionicons
            name="warning-outline"
            size={48}
            color={isDark ? '#F3F4F6' : '#111827'}
          />
        </View>

        {/* Empty State Titles */}
        <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
          No trading activity found
        </Text>
        <Text style={[styles.emptySubtitle, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>
          Select different account or period.
        </Text>

        {/* Yellow Trade Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Trade')}
          style={styles.tradeButton}
        >
          <Text style={styles.tradeButtonText}>Trade</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 16,
  },
  noticeIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    flex: 1,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  filterCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  iconWrapper: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17.5,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '400',
  },
  tradeButton: {
    backgroundColor: '#FFD200',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 6,
    minWidth: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
});
