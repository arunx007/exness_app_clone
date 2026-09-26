import React, { useState } from 'react';
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
import { NicknameScreen } from './NicknameScreen';
import { MaxLeverageScreen } from './MaxLeverageScreen';

interface AccountDetailsModalProps {
  onClose: () => void;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'Funds' | 'Settings'>('Funds');
  const [nickname, setNickname] = useState('Standard');
  const [leverage, setLeverage] = useState('1:2000');
  const [currentSubScreen, setCurrentSubScreen] = useState<'MAIN' | 'NICKNAME' | 'LEVERAGE'>('MAIN');

  if (currentSubScreen === 'NICKNAME') {
    return (
      <NicknameScreen
        currentNickname={nickname}
        onBack={() => setCurrentSubScreen('MAIN')}
        onSave={(newNick) => {
          setNickname(newNick);
          setCurrentSubScreen('MAIN');
        }}
      />
    );
  }

  if (currentSubScreen === 'LEVERAGE') {
    return (
      <MaxLeverageScreen
        currentLeverage={leverage}
        onBack={() => setCurrentSubScreen('MAIN')}
        onSelect={(newLev) => {
          setLeverage(newLev);
          setCurrentSubScreen('MAIN');
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header: Close 'X' and Title 'Standard' */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{nickname}</Text>
      </View>

      {/* Segment Tabs: Funds | Settings */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('Funds')}
          style={[styles.tabItem, activeTab === 'Funds' && styles.tabItemActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Funds' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Funds
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('Settings')}
          style={[styles.tabItem, activeTab === 'Settings' && styles.tabItemActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Settings' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 30 },
        ]}
      >
        {activeTab === 'Funds' ? (
          /* ================= FUNDS TAB (Screenshot 2) ================= */
          <View style={styles.tabContent}>
            {/* Funds Details Card */}
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.rowLabel}>Balance</Text>
                <Text style={styles.rowValue}>0.00 USD</Text>
              </View>

              <View style={styles.cardRow}>
                <Text style={styles.rowLabel}>Equity</Text>
                <Text style={styles.rowValue}>0.00 USD</Text>
              </View>

              <View style={styles.cardRow}>
                <Text style={styles.rowLabel}>Floating P/L</Text>
                <Text style={styles.rowValue}>0.00 USD</Text>
              </View>

              <View style={styles.cardRow}>
                <Text style={styles.rowLabel}>Margin</Text>
                <Text style={styles.rowValue}>0.00 USD</Text>
              </View>

              <View style={styles.cardRow}>
                <Text style={styles.rowLabel}>Free margin</Text>
                <Text style={styles.rowValue}>0.00 USD</Text>
              </View>

              <View style={styles.cardRow}>
                <Text style={styles.rowLabel}>Margin level</Text>
                <Text style={styles.rowValue}>—</Text>
              </View>

              <View style={[styles.cardRow, { marginBottom: 0 }]}>
                <Text style={styles.rowLabel}>Leverage</Text>
                <Text style={styles.rowValue}>{leverage}</Text>
              </View>
            </View>

            {/* Manage statements */}
            <TouchableOpacity style={styles.statementsCard} activeOpacity={0.7}>
              <Text style={styles.statementsText}>Manage statements</Text>
              <Ionicons name="chevron-forward" size={20} color="#8E95A2" />
            </TouchableOpacity>

            {/* Quick Actions Card (Deposit, Withdraw, Transfer, History) */}
            <View style={styles.quickActionsCard}>
              <View style={styles.actionItem}>
                <View style={styles.actionIconCircle}>
                  <Ionicons name="arrow-down-circle-outline" size={26} color="#111827" />
                </View>
                <Text style={styles.actionItemText}>Deposit</Text>
              </View>

              <View style={styles.actionItem}>
                <View style={styles.actionIconCircle}>
                  <Ionicons name="arrow-up-circle-outline" size={26} color="#111827" />
                </View>
                <Text style={styles.actionItemText}>Withdraw</Text>
              </View>

              <View style={styles.actionItem}>
                <View style={styles.actionIconCircle}>
                  <Ionicons name="swap-horizontal" size={24} color="#111827" />
                </View>
                <Text style={styles.actionItemText}>Transfer</Text>
              </View>

              <View style={styles.actionItem}>
                <View style={styles.actionIconCircle}>
                  <Ionicons name="time-outline" size={24} color="#111827" />
                </View>
                <Text style={styles.actionItemText}>History</Text>
              </View>
            </View>
          </View>
        ) : (
          /* ================= SETTINGS TAB (Screenshot 1) ================= */
          <View style={styles.tabContent}>
            {/* Top General Card */}
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.rowLabel}>Type</Text>
                <View style={styles.chipsRow}>
                  <View style={styles.chipPill}>
                    <Text style={styles.chipText}>Broker Bros</Text>
                  </View>
                  <View style={styles.chipPill}>
                    <Text style={styles.chipText}>Standard</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardRow}>
                <Text style={styles.rowLabel}>Number</Text>
                <Text style={styles.rowValue}>#14000102647</Text>
              </View>

              <TouchableOpacity
                onPress={() => setCurrentSubScreen('NICKNAME')}
                activeOpacity={0.7}
                style={[styles.cardRow, { marginBottom: 0 }]}
              >
                <Text style={styles.rowLabel}>Nickname</Text>
                <View style={styles.rowRightClickable}>
                  <Text style={styles.rowValue}>{nickname}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#111827" style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            </View>

            {/* STANDARD ACCOUNT Section */}
            <Text style={styles.sectionHeader}>STANDARD ACCOUNT</Text>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.rowLabel}>Commission per side up to</Text>
                <Text style={styles.rowValue}>0.00 USD</Text>
              </View>

              <View style={styles.cardRow}>
                <Text style={styles.rowLabel}>Minimum spread</Text>
                <Text style={styles.rowValue}>0.2</Text>
              </View>

              <TouchableOpacity
                onPress={() => setCurrentSubScreen('LEVERAGE')}
                activeOpacity={0.7}
                style={[styles.cardRow, { marginBottom: 0 }]}
              >
                <Text style={styles.rowLabel}>Max leverage</Text>
                <View style={styles.rowRightClickable}>
                  <Text style={styles.rowValue}>{leverage}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#111827" style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            </View>

            {/* TRADING PLATFORM - BROKER BROS Section */}
            <Text style={styles.sectionHeader}>TRADING PLATFORM – BROKER BROS</Text>
            <TouchableOpacity style={styles.tradingLogCard} activeOpacity={0.7}>
              <Text style={styles.tradingLogText}>Trading log</Text>
              <Ionicons name="chevron-forward" size={20} color="#111827" />
            </TouchableOpacity>

            {/* Blue Notice Card */}
            <View style={styles.noticeCard}>
              <View style={styles.noticeTopRow}>
                <Ionicons name="information-circle-outline" size={22} color="#0284C7" style={{ marginRight: 10 }} />
                <Text style={styles.noticeText}>
                  This account works on Broker Bros Terminal and Broker Bros App.
                </Text>
              </View>
              <TouchableOpacity style={styles.switchMt5Btn} activeOpacity={0.7}>
                <Text style={styles.switchMt5Text}>Switch to MT5</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#111827',
  },
  tabText: {
    fontSize: 15,
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  tabTextInactive: {
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabContent: {
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  rowLabel: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '400',
  },
  rowValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  rowRightClickable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
  },
  chipPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  chipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E95A2',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  statementsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statementsText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '400',
  },
  quickActionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionItemText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
  },
  tradingLogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  tradingLogText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '400',
  },
  noticeCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  noticeTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 14,
    color: '#0369A1',
    lineHeight: 20,
    flex: 1,
  },
  switchMt5Btn: {
    backgroundColor: '#E0F2FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 32,
  },
  switchMt5Text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0369A1',
  },
});
