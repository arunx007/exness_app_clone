import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Rect, G } from 'react-native-svg';

import { SparklineChart } from '../../components/common/SparklineChart';
import { useAccount } from '../../context/AccountContext';
import {
  SwitchAccountModal,
  OpenAccountModal,
} from '../../components/modals';
import { ChartScreen } from '../Chart/ChartScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TradeInstrument {
  id: string;
  symbol: string;
  name: string;
  type: 'crypto' | 'gold' | 'silver' | 'oil' | 'forex';
  price: string;
  rawPrice: number;
  change: string;
  isPositive: boolean;
  hasMarketBars?: boolean;
  sparkline: number[];
  activeOrders?: {
    count: number;
    pnl: string;
    isLoss: boolean;
  };
}

const INITIAL_INSTRUMENTS: TradeInstrument[] = [
  {
    id: 'inst-btc',
    symbol: 'BTC',
    name: 'Bitcoin vs US Dollar',
    type: 'crypto',
    price: '83691.16',
    rawPrice: 83691.16,
    change: '0.82%',
    isPositive: false,
    hasMarketBars: false,
    sparkline: [84200, 84350, 84100, 83950, 84050, 83750, 83600, 83800, 83500, 83650, 83450, 83700, 83550, 83691],
    activeOrders: {
      count: 1,
      pnl: '-2.64',
      isLoss: true,
    },
  },
  {
    id: 'inst-xau',
    symbol: 'XAU/USD',
    name: 'Gold vs US Dollar',
    type: 'gold',
    price: '4282.369',
    rawPrice: 4282.369,
    change: '0.41%',
    isPositive: true,
    hasMarketBars: true,
    sparkline: [4265, 4268, 4272, 4270, 4275, 4273, 4282, 4288, 4284, 4292, 4286, 4290, 4283, 4282],
  },
  {
    id: 'inst-xag',
    symbol: 'XAG/USD',
    name: 'Silver vs US Dollar',
    type: 'silver',
    price: '64.204',
    rawPrice: 64.204,
    change: '0.96%',
    isPositive: true,
    hasMarketBars: true,
    sparkline: [63.4, 63.6, 63.5, 63.8, 63.7, 64.1, 64.3, 64.0, 64.5, 64.2, 64.4, 64.1, 64.3, 64.2],
  },
  {
    id: 'inst-eth',
    symbol: 'ETH',
    name: 'Ethereum vs US Dollar',
    type: 'crypto',
    price: '2680.95',
    rawPrice: 2680.95,
    change: '0.17%',
    isPositive: false,
    hasMarketBars: false,
    sparkline: [2685, 2688, 2684, 2692, 2687, 2680, 2676, 2682, 2678, 2681, 2675, 2679, 2677, 2680],
  },
  {
    id: 'inst-usoil',
    symbol: 'USOIL',
    name: 'Crude Oil',
    type: 'oil',
    price: '91.257',
    rawPrice: 91.257,
    change: '1.72%',
    isPositive: false,
    hasMarketBars: true,
    sparkline: [93.2, 93.0, 92.6, 92.8, 92.3, 91.8, 92.1, 91.5, 91.9, 91.4, 91.6, 91.0, 91.4, 91.25],
  },
  {
    id: 'inst-usdjpy',
    symbol: 'USD/JPY',
    name: 'US Dollar vs Japanese Yen',
    type: 'forex',
    price: '157.338',
    rawPrice: 157.338,
    change: '0.94%',
    isPositive: false,
    hasMarketBars: false,
    sparkline: [158.9, 158.7, 158.5, 158.6, 158.2, 158.0, 157.8, 157.9, 157.6, 157.4, 157.5, 157.2, 157.4, 157.33],
  },
];

const CATEGORY_TABS = [
  'Favorites',
  'Most traded',
  'Top Movers',
  'Majors',
  'Crypto',
  'Forex',
  'Metals',
];

export const TradeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { accounts, activeAccount, setActiveAccount, addAccount, updateBalance } = useAccount();
  const isFocused = useIsFocused();

  const [activeTab, setActiveTab] = useState<string>('Favorites');
  const [instruments, setInstruments] = useState<TradeInstrument[]>(INITIAL_INSTRUMENTS);
  const [showSwitchAccount, setShowSwitchAccount] = useState<boolean>(false);
  const [showOpenAccount, setShowOpenAccount] = useState<boolean>(false);
  const [selectedChartSymbol, setSelectedChartSymbol] = useState<string | null>(null);

  // Reset chart symbol if switching tabs
  useEffect(() => {
    if (!isFocused) {
      setSelectedChartSymbol(null);
    }
  }, [isFocused]);

  // Live price fluctuation effect (Real-time live tick simulation)
  useEffect(() => {
    const interval = setInterval(() => {
      setInstruments((prevInstruments) =>
        prevInstruments.map((item) => {
          // Slight random tick: between -0.05% and +0.05%
          const pctChange = (Math.random() * 0.001 - 0.0005);
          const newRawPrice = item.rawPrice * (1 + pctChange);

          // Decimals format based on original price
          const decimals = item.price.includes('.') ? item.price.split('.')[1].length : 2;
          const formattedPrice = newRawPrice.toFixed(decimals);

          // Update sparkline points
          const newSparkline = [...item.sparkline.slice(1), newRawPrice];

          // If BTC, slightly update live order loss
          let newOrders = item.activeOrders;
          if (item.symbol === 'BTC' && item.activeOrders) {
            const deltaPnl = (Math.random() * 0.04 - 0.02);
            const currentPnlVal = parseFloat(item.activeOrders.pnl);
            const updatedPnl = (currentPnlVal + deltaPnl).toFixed(2);
            newOrders = {
              ...item.activeOrders,
              pnl: updatedPnl,
              isLoss: parseFloat(updatedPnl) < 0,
            };
          }

          return {
            ...item,
            rawPrice: newRawPrice,
            price: formattedPrice,
            sparkline: newSparkline,
            activeOrders: newOrders,
          };
        })
      );
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP BAR: Centered Account Badge & Right Clock Icon */}
      <View style={styles.topBar}>
        {/* Centered Account Selector Pill */}
        <TouchableOpacity
          style={styles.accountPill}
          activeOpacity={0.8}
          onPress={() => setShowSwitchAccount(true)}
        >
          <View
            style={[
              styles.accountTypeChip,
              activeAccount.type === 'Demo' ? styles.demoChip : styles.realChip,
            ]}
          >
            <Text
              style={[
                styles.accountTypeChipText,
                activeAccount.type === 'Demo' ? styles.demoChipText : styles.realChipText,
              ]}
            >
              {activeAccount.type}
            </Text>
          </View>

          <Text style={styles.accountBalanceText}>
            {activeAccount.balance} {activeAccount.currency}
          </Text>

          <Ionicons
            name="ellipsis-vertical"
            size={14}
            color="#111827"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        {/* Right Clock Icon */}
        <TouchableOpacity style={styles.clockBtn} activeOpacity={0.7}>
          <Ionicons name="time-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* SCREEN TITLE: "Trade" */}
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>Trade</Text>
      </View>

      {/* HORIZONTAL CATEGORY TABS & SEARCH */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollView}
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    isActive ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                >
                  {tab}
                </Text>
                {isActive && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Search Icon */}
        <TouchableOpacity style={styles.searchBtn} activeOpacity={0.7}>
          <Ionicons name="search-outline" size={22} color="#111827" />
        </TouchableOpacity>
      </View>
      <View style={styles.tabsDivider} />

      {/* FILTER SUB-BAR: "Sorted manually" & "Edit ✎" */}
      <View style={styles.filterRow}>
        <View style={styles.filterPill}>
          <Text style={styles.filterPillText}>Sorted manually</Text>
        </View>

        <TouchableOpacity style={styles.editPill} activeOpacity={0.7}>
          <Text style={styles.editPillText}>Edit</Text>
          <Ionicons name="create-outline" size={15} color="#111827" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* INSTRUMENTS LIST */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.instrumentsList}
      >
        {instruments.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            style={styles.instrumentCard}
            onPress={() => setSelectedChartSymbol(item.symbol)}
          >
            {/* Top row of card */}
            <View style={styles.cardMainRow}>
              {/* Left Column: Icon + Symbol + Subtitle */}
              <View style={styles.cardLeft}>
                {/* Custom Icon representations */}
                {item.symbol === 'BTC' && (
                  <View style={styles.btcCircle}>
                    <Text style={styles.btcSymbolText}>₿</Text>
                  </View>
                )}

                {item.symbol === 'XAU/USD' && (
                  <View style={styles.dualIconContainer}>
                    <View style={styles.goldCube}>
                      <Ionicons name="cube" size={13} color="#FFFFFF" />
                    </View>
                    <View style={styles.usFlagCircle}>
                      <Ionicons name="flag" size={11} color="#FFFFFF" />
                    </View>
                  </View>
                )}

                {item.symbol === 'XAG/USD' && (
                  <View style={styles.dualIconContainer}>
                    <View style={styles.silverCube}>
                      <Ionicons name="cube" size={13} color="#FFFFFF" />
                    </View>
                    <View style={styles.usFlagCircle}>
                      <Ionicons name="flag" size={11} color="#FFFFFF" />
                    </View>
                  </View>
                )}

                {item.symbol === 'ETH' && (
                  <View style={styles.ethCircle}>
                    <Ionicons name="diamond" size={16} color="#111827" />
                  </View>
                )}

                {item.symbol === 'USOIL' && (
                  <View style={styles.oilCircle}>
                    <Ionicons name="water" size={16} color="#FFFFFF" />
                  </View>
                )}

                {item.symbol === 'USD/JPY' && (
                  <View style={styles.dualIconContainer}>
                    <View style={styles.usFlagCircleLeft}>
                      <Ionicons name="flag" size={11} color="#FFFFFF" />
                    </View>
                    <View style={styles.japanFlagCircle}>
                      <View style={styles.japanRedDot} />
                    </View>
                  </View>
                )}

                {/* Symbol & Subtitle */}
                <View style={styles.symbolInfo}>
                  <View style={styles.symbolHeaderRow}>
                    <Text style={styles.symbolText}>{item.symbol}</Text>
                    {item.hasMarketBars && (
                      <View style={styles.marketStatusBars}>
                        <View style={styles.statusBar} />
                        <View style={styles.statusBar} />
                        <View style={styles.statusBar} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.instrumentSubtitle}>{item.name}</Text>
                </View>
              </View>

              {/* Middle Column: Live Sparkline Chart with Dashed Baseline */}
              <View style={styles.cardCenter}>
                <SparklineChart
                  points={item.sparkline}
                  isPositive={item.isPositive}
                  width={78}
                  height={28}
                />
              </View>

              {/* Right Column: Price & Change */}
              <View style={styles.cardRight}>
                <Text style={styles.priceText}>{item.price}</Text>
                <View style={styles.changeRow}>
                  <Text
                    style={[
                      styles.changeText,
                      { color: item.isPositive ? '#2563EB' : '#EF4444' },
                    ]}
                  >
                    {item.isPositive ? '↑' : '↓'} {item.change}
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom active order banner (if any) */}
            {item.activeOrders && (
              <View style={styles.activeOrderBanner}>
                <Text style={styles.activeOrderLabel}>
                  Orders {item.activeOrders.count}
                </Text>
                <Text style={styles.activeOrderPnl}>
                  {item.activeOrders.isLoss ? 'Loss ' : 'Profit '}
                  {item.activeOrders.pnl} USD
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Switch Account Modal */}
      <SwitchAccountModal
        visible={showSwitchAccount}
        accounts={accounts}
        activeAccountId={activeAccount.id}
        onSelectAccount={(account) => setActiveAccount(account)}
        onOpenNewAccount={() => setShowOpenAccount(true)}
        onClose={() => setShowSwitchAccount(false)}
      />

      {/* Open Account Modal with 3-Step Wizard */}
      <OpenAccountModal
        visible={showOpenAccount}
        onClose={() => setShowOpenAccount(false)}
        onAccountCreated={(newAccount) => {
          addAccount(newAccount);
        }}
      />

      {/* Chart Screen Full Modal */}
      {selectedChartSymbol && (
        <Modal
          visible={true}
          animationType="slide"
          onRequestClose={() => setSelectedChartSymbol(null)}
        >
          <ChartScreen
            symbol={selectedChartSymbol}
            onClose={() => setSelectedChartSymbol(null)}
          />
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    position: 'relative',
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingVertical: 5,
    paddingLeft: 6,
    paddingRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  accountTypeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
  },
  demoChip: {
    backgroundColor: '#E6F7EC',
  },
  realChip: {
    backgroundColor: '#FFF8E1',
  },
  accountTypeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  demoChipText: {
    color: '#0A8754',
  },
  realChipText: {
    color: '#B45309',
  },
  accountBalanceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  clockBtn: {
    position: 'absolute',
    right: 16,
    padding: 6,
  },
  titleRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.8,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  tabsScrollView: {
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingVertical: 8,
    marginRight: 22,
    position: 'relative',
  },
  tabButtonActive: {},
  tabButtonText: {
    fontSize: 15,
  },
  tabTextActive: {
    fontWeight: '700',
    color: '#111827',
  },
  tabTextInactive: {
    fontWeight: '500',
    color: '#6B7280',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#111827',
  },
  searchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabsDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    width: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterPill: {
    backgroundColor: '#F4F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
  },
  filterPillText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editPillText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  instrumentsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  instrumentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.2,
  },
  btcCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7931A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  btcSymbolText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  dualIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 38,
    marginRight: 10,
  },
  goldCube: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  silverCube: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  usFlagCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  usFlagCircleLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  japanFlagCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  japanRedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  ethCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  oilCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  symbolInfo: {
    justifyContent: 'center',
  },
  symbolHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  marketStatusBars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  statusBar: {
    width: 2.5,
    height: 11,
    backgroundColor: '#EA580C',
    borderRadius: 1,
    marginHorizontal: 0.8,
  },
  instrumentSubtitle: {
    fontSize: 12.5,
    color: '#8E95A2',
    marginTop: 2,
  },
  cardCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  changeRow: {
    marginTop: 2,
  },
  changeText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  activeOrderBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
  },
  activeOrderLabel: {
    fontSize: 12.5,
    color: '#1F2937',
    fontWeight: '500',
  },
  activeOrderPnl: {
    fontSize: 12.5,
    color: '#DC2626',
    fontWeight: '600',
  },
});
