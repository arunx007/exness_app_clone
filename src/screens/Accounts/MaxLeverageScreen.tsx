import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface LeverageOption {
  label: string;
  isHigh?: boolean;
  color: string; // red, orange, green
}

const LEVERAGE_OPTIONS: LeverageOption[] = [
  { label: '1:Unlimited', color: '#EF4444' },
  { label: '1:2000', isHigh: true, color: '#EF4444' },
  { label: '1:1000', color: '#EF4444' },
  { label: '1:800', color: '#EF4444' },
  { label: '1:600', color: '#EF4444' },
  { label: '1:500', color: '#EF4444' },
  { label: '1:400', color: '#EF4444' },
  { label: '1:200', color: '#EF4444' },
  { label: '1:100', color: '#F59E0B' },
  { label: '1:50', color: '#F59E0B' },
  { label: '1:20', color: '#10B981' },
  { label: '1:2', color: '#10B981' },
];

interface MaxLeverageScreenProps {
  currentLeverage: string;
  onBack: () => void;
  onSelect: (leverage: string) => void;
}

export const MaxLeverageScreen: React.FC<MaxLeverageScreenProps> = ({
  currentLeverage,
  onBack,
  onSelect,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={26} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Max leverage</Text>
        </View>

        <TouchableOpacity style={styles.infoBtn} activeOpacity={0.7}>
          <Ionicons name="information-circle-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 30 },
        ]}
      >
        {/* Custom Leverage Card */}
        <TouchableOpacity style={styles.customCard} activeOpacity={0.7}>
          <Text style={styles.customCardTitle}>Custom leverage</Text>
          <View style={styles.customCardRight}>
            <Text style={styles.notSetText}>Not set</Text>
            <Ionicons name="chevron-forward" size={18} color="#8E95A2" />
          </View>
        </TouchableOpacity>

        {/* Leverage Options List */}
        <View style={styles.listContainer}>
          {LEVERAGE_OPTIONS.map((item, idx) => {
            const isSelected = item.label === currentLeverage;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => onSelect(item.label)}
                activeOpacity={0.7}
                style={styles.optionRow}
              >
                <View style={styles.optionLeft}>
                  {/* Color bar indicator */}
                  <View
                    style={[
                      styles.colorBar,
                      { backgroundColor: item.color },
                    ]}
                  />
                  <Text style={styles.optionLabel}>{item.label}</Text>
                </View>

                {/* Right side (High badge & checkmark) */}
                <View style={styles.optionRight}>
                  {item.isHigh && <Text style={styles.highTag}>High</Text>}
                  {isSelected && (
                    <Ionicons name="checkmark" size={22} color="#111827" style={{ marginLeft: 8 }} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },
  infoBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  customCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  customCardTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '400',
  },
  customCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notSetText: {
    fontSize: 15,
    color: '#8E95A2',
    marginRight: 4,
  },
  listContainer: {
    width: '100%',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '400',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highTag: {
    fontSize: 15,
    color: '#8E95A2',
  },
});
