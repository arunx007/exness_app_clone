import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line, Rect, Text as SvgText, G } from 'react-native-svg';

import * as SecureStore from 'expo-secure-store';
import { useAccount } from '../../context/AccountContext';
import {
  SwitchAccountModal,
  OpenAccountModal,
  ClosePositionModal,
  ChartOrdersModal,
  ModifyOrderModal,
  OneClickTradingModal,
} from '../../components/modals';
import { PositionOrder } from '../../components/cards/OrderCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChartScreenProps {
  symbol?: string;
  onClose?: () => void;
}

// Realistic candlestick data structure
interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

const INITIAL_CANDLES: Candle[] = [
  { time: '13:30', open: 84400, high: 84600, low: 84150, close: 84250 },
  { time: '13:45', open: 84250, high: 84300, low: 83800, close: 83900 },
  { time: '14:00', open: 83900, high: 84150, low: 83700, close: 83800 },
  { time: '14:15', open: 83800, high: 84050, low: 83500, close: 83650 },
  { time: '14:30', open: 83650, high: 83900, low: 83400, close: 83450 },
  { time: '14:45', open: 83450, high: 83800, low: 83300, close: 83750 },
  { time: '15:00', open: 83750, high: 84100, low: 83650, close: 84000 },
  { time: '15:15', open: 84000, high: 84150, low: 83750, close: 83850 },
  { time: '15:30', open: 83850, high: 83950, low: 83550, close: 83600 },
  { time: '15:45', open: 83600, high: 83850, low: 83350, close: 83400 },
  { time: '16:00', open: 83400, high: 84050, low: 83380, close: 83950 },
  { time: '16:15', open: 83950, high: 84100, low: 83700, close: 83800 },
  { time: '16:30', open: 83800, high: 83900, low: 83600, close: 83700 },
  { time: '16:45', open: 83700, high: 83850, low: 83550, close: 83820 },
  { time: '17:00', open: 83820, high: 83950, low: 83650, close: 83750 },
  { time: '17:15', open: 83750, high: 83880, low: 83680, close: 83751.82 },
];

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1D'];

export const ChartScreen: React.FC<ChartScreenProps> = ({
  symbol = 'BTC',
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { accounts, activeAccount, setActiveAccount, addAccount } = useAccount();

  // State
  const [oneClickEnabled, setOneClickEnabled] = useState(false);
  const [showOneClickModal, setShowOneClickModal] = useState(false);
  const [dontShowOneClickModal, setDontShowOneClickModal] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('5m');
  const [showTimeframePicker, setShowTimeframePicker] = useState(false);
  const [showSwitchAccount, setShowSwitchAccount] = useState(false);
  const [showOpenAccount, setShowOpenAccount] = useState(false);

  // Load "Don't show again" preference for One-click trading modal
  useEffect(() => {
    SecureStore.getItemAsync('one_click_dont_show_again')
      .then((val) => {
        if (val === 'true') {
          setDontShowOneClickModal(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleOneClick = () => {
    if (!oneClickEnabled) {
      if (dontShowOneClickModal) {
        setOneClickEnabled(true);
      } else {
        setShowOneClickModal(true);
      }
    } else {
      setOneClickEnabled(false);
    }
  };

  const handleEnableOneClick = async (dontShowAgain: boolean) => {
    setOneClickEnabled(true);
    setShowOneClickModal(false);
    if (dontShowAgain) {
      setDontShowOneClickModal(true);
      try {
        await SecureStore.setItemAsync('one_click_dont_show_again', 'true');
      } catch (e) {
        // ignore
      }
    }
  };

  // Live prices
  const [bidPrice, setBidPrice] = useState(83751.82);
  const [askPrice, setAskPrice] = useState(83761.82);
  const [orderPnl, setOrderPnl] = useState('-2.03');
  const [closingOrder, setClosingOrder] = useState<PositionOrder | null>(null);
  const [showOrdersModal, setShowOrdersModal] = useState<boolean>(false);
  const [ordersModalTab, setOrdersModalTab] = useState<'Open' | 'Pending' | 'Closed'>('Open');
  const [modifyingOrder, setModifyingOrder] = useState<PositionOrder | null>(null);

  // Live UTC Clock
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${h}:${m}:${s} UTC`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live Market Tick Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const tick = (Math.random() * 4 - 2);
      setBidPrice((prev) => {
        const next = prev + tick;
        setAskPrice(next + 10.0);
        // Update P/L: Order open price is 83,954.32, Buy lot 0.01
        const pnl = ((next - 83954.32) * 0.01).toFixed(2);
        setOrderPnl(pnl);
        return parseFloat(next.toFixed(2));
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const openOrderData: PositionOrder = {
    id: 'ord-btc-active',
    symbol: 'BTC',
    type: 'Buy',
    lot: 0.01,
    openPrice: '83954.32',
    currentPrice: bidPrice.toFixed(2),
    pnl: orderPnl,
    isProfit: parseFloat(orderPnl) >= 0,
  };

  // Dimensions for Chart Area
  const chartHeight = 440;
  const priceAxisWidth = 68;
  const chartWidth = SCREEN_WIDTH - priceAxisWidth;

  const minPrice = 82800;
  const maxPrice = 85000;
  const priceRange = maxPrice - minPrice;

  const getYForPrice = (p: number) => {
    return chartHeight - ((p - minPrice) / priceRange) * chartHeight;
  };

  const candleSlotWidth = chartWidth / INITIAL_CANDLES.length;
  const candleBodyWidth = Math.max(candleSlotWidth * 0.6, 5);

  const orderLineY = getYForPrice(83954.32);
  const currentBidY = getYForPrice(bidPrice);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP PULL-DOWN HANDLE */}
      <View style={styles.topHandleContainer}>
        <View style={styles.topHandle} />
      </View>

      {/* HEADER BAR (Row 1): One-click | Account Capsule | Clock & Gear */}
      <View style={styles.headerBar}>
        {/* Left: One-Click Trading Toggle */}
        <TouchableOpacity
          style={[
            styles.oneClickCapsule,
            oneClickEnabled && styles.oneClickCapsuleActive,
          ]}
          activeOpacity={0.8}
          onPress={handleToggleOneClick}
        >
          <View
            style={[
              styles.lightningCircle,
              oneClickEnabled && styles.lightningCircleActive,
            ]}
          >
            <Ionicons
              name="flash"
              size={11}
              color={oneClickEnabled ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
          <Text
            style={[
              styles.oneClickText,
              oneClickEnabled && styles.oneClickTextActive,
            ]}
          >
            One-click
          </Text>
        </TouchableOpacity>

        {/* Center: Account Capsule */}
        <TouchableOpacity
          style={styles.accountCapsule}
          activeOpacity={0.8}
          onPress={() => setShowSwitchAccount(true)}
        >
          <View
            style={[
              styles.demoChip,
              activeAccount.type === 'Demo' ? styles.demoBg : styles.realBg,
            ]}
          >
            <Text
              style={[
                styles.demoChipText,
                activeAccount.type === 'Demo' ? styles.demoColor : styles.realColor,
              ]}
            >
              {activeAccount.type}
            </Text>
          </View>

          <Text style={styles.balanceText} numberOfLines={1}>
            {activeAccount.balance} ...
          </Text>
        </TouchableOpacity>

        {/* Right: Clock & Settings Icons */}
        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
            <Ionicons name="time-outline" size={22} color="#111827" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={21} color="#111827" />
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              style={[styles.headerIconBtn, { marginLeft: 2 }]}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#111827" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* FLOATING ORDERS SUMMARY BAR (Row 2) */}
      <TouchableOpacity
        style={styles.ordersSummaryBar}
        activeOpacity={0.8}
        onPress={() => {
          setOrdersModalTab('Open');
          setShowOrdersModal(true);
        }}
      >
        <View style={styles.ordersLeftGroup}>
          <TouchableOpacity
            style={styles.orderBadgeRow}
            activeOpacity={0.7}
            onPress={() => {
              setOrdersModalTab('Open');
              setShowOrdersModal(true);
            }}
          >
            <Text style={styles.ordersLabel}>Open</Text>
            <View style={styles.countBadgeActive}>
              <Text style={styles.countBadgeText}>1</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.orderBadgeRow, { marginLeft: 16 }]}
            activeOpacity={0.7}
            onPress={() => {
              setOrdersModalTab('Pending');
              setShowOrdersModal(true);
            }}
          >
            <Text style={styles.ordersLabel}>Pending</Text>
            <View style={styles.countBadgeInactive}>
              <Text style={styles.countBadgeText}>0</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.ordersRightGroup}>
          <Text style={styles.summaryPnlText}>{orderPnl} USD</Text>
          <TouchableOpacity
            style={styles.closeSummaryBtn}
            activeOpacity={0.7}
            onPress={() => setClosingOrder(openOrderData)}
          >
            <Ionicons name="close" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* CHART TOOLBAR (Row 3): Toolbar with Timeframe & Indicators */}
      <View style={styles.chartToolbar}>
        {/* Left icon: sidebar toggle */}
        <TouchableOpacity style={styles.toolbarBtn}>
          <Ionicons name="chevron-back-outline" size={17} color="#4B5563" />
        </TouchableOpacity>

        {/* Timeframe Button */}
        <TouchableOpacity
          style={styles.timeframeBtn}
          onPress={() => setShowTimeframePicker(!showTimeframePicker)}
        >
          <Text style={styles.timeframeText}>{selectedTimeframe}</Text>
        </TouchableOpacity>

        {/* Candlestick type icon */}
        <TouchableOpacity style={styles.toolbarBtn}>
          <Ionicons name="stats-chart-outline" size={17} color="#4B5563" />
        </TouchableOpacity>

        {/* Indicators fx icon */}
        <TouchableOpacity style={styles.toolbarBtn}>
          <Text style={styles.fxText}>fx</Text>
        </TouchableOpacity>

        {/* Compare / Layout icon */}
        <TouchableOpacity style={styles.toolbarBtn}>
          <Ionicons name="grid-outline" size={16} color="#4B5563" />
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.toolbarDivider} />

        {/* Undo / Redo Arrow */}
        <TouchableOpacity style={styles.toolbarBtn}>
          <Ionicons name="arrow-down-outline" size={16} color="#EF4444" />
        </TouchableOpacity>

        {/* Save Cloud / Button */}
        <TouchableOpacity style={styles.saveContainer}>
          <Text style={styles.saveTitle}>Save</Text>
          <Text style={styles.saveSubtitle}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* DEDICATED TRADINGVIEW CHART CONTAINER AREA */}
      {/* (Can be slotted with TradingView WebView or native chart component) */}
      <View style={styles.tradingViewChartContainer}>
        {/* Top-Left Chart Header Overlay */}
        <View style={styles.chartHeaderOverlay}>
          <View style={styles.symbolBadgeRow}>
            <View style={styles.btcMiniCircle}>
              <Text style={styles.btcMiniText}>₿</Text>
            </View>
            <Text style={styles.chartSymbolText}>{symbol}</Text>
            <Ionicons name="chevron-down" size={14} color="#6B7280" style={{ marginHorizontal: 2 }} />
            <Text style={styles.chartPeriodText}>· 5</Text>
          </View>
          <Text style={styles.chartLivePriceText}>
            {bidPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Main Chart Canvas with Candlesticks, Grids & Order Lines */}
        <View style={styles.chartCanvasRow}>
          <Svg width={chartWidth} height={chartHeight}>
            {/* Background Grid Horizontal Lines */}
            {[84800, 84600, 84400, 84200, 84000, 83800, 83600, 83400, 83200, 83000].map(
              (p) => {
                const y = getYForPrice(p);
                return (
                  <Line
                    key={p}
                    x1="0"
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="#F3F4F6"
                    strokeWidth="1"
                  />
                );
              }
            )}

            {/* Vertical Time Grid Lines */}
            {[2, 6, 10, 14].map((idx) => {
              const x = idx * candleSlotWidth + candleSlotWidth / 2;
              return (
                <Line
                  key={idx}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2={chartHeight}
                  stroke="#F3F4F6"
                  strokeWidth="1"
                />
              );
            })}

            {/* Candlesticks */}
            {INITIAL_CANDLES.map((c, i) => {
              const isBullish = c.close >= c.open;
              const xCenter = i * candleSlotWidth + candleSlotWidth / 2;
              const yHigh = getYForPrice(c.high);
              const yLow = getYForPrice(c.low);
              const yTop = getYForPrice(Math.max(c.open, c.close));
              const yBottom = getYForPrice(Math.min(c.open, c.close));
              const bodyHeight = Math.max(yBottom - yTop, 2);

              const candleColor = isBullish ? '#1E88E5' : '#EF4444';

              return (
                <G key={i}>
                  {/* Wick */}
                  <Line
                    x1={xCenter}
                    y1={yHigh}
                    x2={xCenter}
                    y2={yLow}
                    stroke={candleColor}
                    strokeWidth="1.2"
                  />
                  {/* Body */}
                  <Rect
                    x={xCenter - candleBodyWidth / 2}
                    y={yTop}
                    width={candleBodyWidth}
                    height={bodyHeight}
                    fill={candleColor}
                  />
                </G>
              );
            })}

            {/* LIVE ORDER HORIZONTAL LINE (at 83,954.32) */}
            <Line
              x1="0"
              y1={orderLineY}
              x2={chartWidth}
              y2={orderLineY}
              stroke="#1E88E5"
              strokeWidth="1"
            />

            {/* Current Bid Horizontal Dotted Line */}
            <Line
              x1="0"
              y1={currentBidY}
              x2={chartWidth}
              y2={currentBidY}
              stroke="#EF4444"
              strokeWidth="1"
              strokeDasharray="2, 2"
            />
          </Svg>

          {/* RIGHT VERTICAL PRICE AXIS (1:1 with screenshot) */}
          <View style={[styles.priceAxisColumn, { width: priceAxisWidth, height: chartHeight }]}>
            {[
              85000, 84800, 84600, 84400, 84200, 84000, 83800, 83600, 83400, 83200, 83000,
              82800,
            ].map((p) => {
              const y = getYForPrice(p);
              return (
                <Text
                  key={p}
                  style={[styles.axisPriceLabel, { top: y - 7 }]}
                >
                  {p.toLocaleString('en-US')}.00
                </Text>
              );
            })}

            {/* Active Order Price Tag on Axis (Blue) */}
            <View style={[styles.orderPriceTagAxis, { top: orderLineY - 10 }]}>
              <Text style={styles.orderPriceTagAxisText}>83,954.32</Text>
            </View>

            {/* Ask Price Tag on Axis (White with Blue outline) */}
            <View style={[styles.askPriceTagAxis, { top: getYForPrice(askPrice) - 10 }]}>
              <Text style={styles.askPriceTagAxisText}>{askPrice.toFixed(2)}</Text>
            </View>

            {/* Current Live Bid Price Tag on Axis (Red filled) */}
            <View style={[styles.bidPriceTagAxis, { top: currentBidY - 10 }]}>
              <Text style={styles.bidPriceTagAxisText}>{bidPrice.toFixed(2)}</Text>
            </View>
          </View>

          {/* FLOATING ORDER ACTION CHIPS ON THE ORDER LINE (1:1 with screenshot) */}
          <View style={[styles.orderLineFloatingRow, { top: orderLineY - 14 }]}>
            {/* TP Tag */}
            <View style={styles.tpBox}>
              <Text style={styles.tpText}>TP</Text>
            </View>

            {/* SL Tag */}
            <View style={styles.slBox}>
              <Text style={styles.slText}>SL</Text>
            </View>

            {/* Order Lot & Live P/L Pill */}
            <View style={styles.orderPillContainer}>
              <View style={styles.orderLotTag}>
                <Text style={styles.orderLotTagText}>0.01</Text>
              </View>

              <View style={styles.orderPnlBox}>
                <Text style={styles.orderPnlBoxText}>{orderPnl} USD</Text>
              </View>

              <TouchableOpacity
                style={styles.orderCloseBtn}
                activeOpacity={0.7}
                onPress={() => setClosingOrder(openOrderData)}
              >
                <Ionicons name="close" size={14} color="#1E88E5" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* BOTTOM TIME AXIS */}
        <View style={styles.timeAxisRow}>
          <View style={styles.timeLabelsGroup}>
            <Text style={styles.timeAxisLabel}>14:00</Text>
            <Text style={styles.timeAxisLabel}>15:00</Text>
            <Text style={styles.timeAxisLabel}>16:00</Text>
            <Text style={styles.timeAxisLabel}>17:00</Text>
          </View>
          <TouchableOpacity style={styles.axisGearBtn}>
            <Ionicons name="settings-outline" size={15} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* TIME AXIS FOOTER BAR (Date Range | UTC Clock | % log auto) */}
        <View style={styles.chartFooterRow}>
          <TouchableOpacity style={styles.dateRangeBtn}>
            <Text style={styles.dateRangeText}>Date Range</Text>
            <Ionicons name="chevron-down" size={13} color="#4B5563" style={{ marginLeft: 2 }} />
          </TouchableOpacity>

          <Text style={styles.utcClockText}>{utcTime || '17:50:43 UTC'}</Text>

          <View style={styles.chartModeGroup}>
            <Text style={styles.chartModeText}>%</Text>
            <Text style={styles.chartModeText}>log</Text>
            <Text style={styles.chartModeText}>auto</Text>
          </View>
        </View>
      </View>

      {/* BOTTOM TRADING ACTION BAR: Sell & Buy Buttons + Sentiment Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* Sell & Buy Buttons Row with Middle Spread Badge */}
        <View style={styles.tradeButtonsRow}>
          {/* SELL BUTTON (Red) */}
          <TouchableOpacity
            style={styles.sellBtn}
            activeOpacity={0.88}
            onPress={() => alert(`Sell order placed at ${bidPrice.toFixed(2)}`)}
          >
            <Text style={styles.tradeActionTitle}>Sell</Text>
            <Text style={styles.tradeActionPrice}>{bidPrice.toFixed(2)}</Text>
          </TouchableOpacity>

          {/* Floating Middle Spread Badge */}
          <View style={styles.spreadBadge}>
            <Text style={styles.spreadText}>10.00</Text>
          </View>

          {/* BUY BUTTON (Blue) */}
          <TouchableOpacity
            style={styles.buyBtn}
            activeOpacity={0.88}
            onPress={() => alert(`Buy order placed at ${askPrice.toFixed(2)}`)}
          >
            <Text style={styles.tradeActionTitle}>Buy</Text>
            <Text style={styles.tradeActionPrice}>{askPrice.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>

        {/* Sentiment Gauge Bar */}
        <View style={styles.sentimentContainer}>
          <View style={styles.sentimentBarsRow}>
            <View style={styles.sentimentBarRed} />
            <View style={styles.sentimentBarBlue} />
          </View>
          <View style={styles.sentimentLabelsRow}>
            <Text style={styles.sentimentTextRed}>49%</Text>
            <Text style={styles.sentimentTextBlue}>51%</Text>
          </View>
        </View>
      </View>

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

      {/* Close Position Modal */}
      <ClosePositionModal
        visible={closingOrder !== null}
        order={closingOrder}
        onConfirm={() => setClosingOrder(null)}
        onCancel={() => setClosingOrder(null)}
      />

      {/* Chart Orders Modal (1:1 with media_1790359184602.jpg) */}
      <ChartOrdersModal
        visible={showOrdersModal}
        orders={[openOrderData]}
        initialTab={ordersModalTab}
        onClose={() => setShowOrdersModal(false)}
        onOrderPress={(ord) => {
          setShowOrdersModal(false);
          setModifyingOrder(ord);
        }}
      />

      {/* Modify Order Modal */}
      <ModifyOrderModal
        visible={modifyingOrder !== null}
        order={modifyingOrder}
        onCloseOrder={() => {
          if (modifyingOrder) {
            const ord = modifyingOrder;
            setModifyingOrder(null);
            setClosingOrder(ord);
          }
        }}
        onDismiss={() => setModifyingOrder(null)}
      />

      {/* One-Click Trading Info & Confirmation Modal */}
      <OneClickTradingModal
        visible={showOneClickModal}
        onClose={() => setShowOneClickModal(false)}
        onEnable={handleEnableOneClick}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHandleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  topHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  oneClickCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  oneClickCapsuleActive: {
    backgroundColor: '#FEF3C7',
  },
  lightningCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  lightningCircleActive: {
    backgroundColor: '#F59E0B',
  },
  oneClickText: {
    fontSize: 12.5,
    color: '#9CA3AF',
    fontWeight: '500',
    paddingRight: 4,
  },
  oneClickTextActive: {
    color: '#B45309',
    fontWeight: '600',
  },
  accountCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingVertical: 4,
    paddingLeft: 6,
    paddingRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  demoChip: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    marginRight: 6,
  },
  demoBg: {
    backgroundColor: '#E6F7EC',
  },
  realBg: {
    backgroundColor: '#FFF8E1',
  },
  demoChipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  demoColor: {
    color: '#0A8754',
  },
  realColor: {
    color: '#B45309',
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    padding: 6,
    marginLeft: 2,
  },
  ordersSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  ordersLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ordersLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginRight: 6,
  },
  countBadgeActive: {
    backgroundColor: '#5C748C',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countBadgeInactive: {
    backgroundColor: '#9CA3AF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  ordersRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryPnlText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginRight: 10,
  },
  closeSummaryBtn: {
    padding: 2,
  },
  chartToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toolbarBtn: {
    padding: 6,
    marginRight: 10,
  },
  timeframeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  fxText: {
    fontSize: 15,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#4B5563',
  },
  toolbarDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  saveContainer: {
    marginLeft: 'auto',
    alignItems: 'center',
  },
  saveTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 14,
  },
  saveSubtitle: {
    fontSize: 9,
    color: '#9CA3AF',
    lineHeight: 11,
  },

  /* TRADINGVIEW CHART CONTAINER STYLES */
  tradingViewChartContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  chartHeaderOverlay: {
    position: 'absolute',
    top: 6,
    left: 14,
    zIndex: 10,
  },
  symbolBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btcMiniCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F7931A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  btcMiniText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  chartSymbolText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  chartPeriodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  chartLivePriceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E88E5',
    marginTop: 2,
  },
  chartCanvasRow: {
    flexDirection: 'row',
    flex: 1,
    position: 'relative',
  },
  priceAxisColumn: {
    borderLeftWidth: 1,
    borderLeftColor: '#F3F4F6',
    position: 'relative',
  },
  axisPriceLabel: {
    position: 'absolute',
    left: 4,
    fontSize: 10.5,
    color: '#6B7280',
    fontWeight: '400',
  },
  orderPriceTagAxis: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#1E88E5',
    paddingVertical: 2,
    paddingHorizontal: 3,
    zIndex: 5,
  },
  orderPriceTagAxisText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  askPriceTagAxis: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1E88E5',
    paddingVertical: 1.5,
    paddingHorizontal: 2,
    zIndex: 6,
  },
  askPriceTagAxisText: {
    color: '#1E88E5',
    fontSize: 9.5,
    fontWeight: '700',
  },
  bidPriceTagAxis: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#EF4444',
    paddingVertical: 2,
    paddingHorizontal: 3,
    zIndex: 7,
  },
  bidPriceTagAxisText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },

  /* Floating Order line tags */
  orderLineFloatingRow: {
    position: 'absolute',
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
  },
  tpBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#10B981',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  tpText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  slBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D97706',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  slText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '700',
  },
  orderPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E88E5',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  orderLotTag: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  orderLotTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  orderPnlBox: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orderPnlBoxText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  orderCloseBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },

  /* Time Axis */
  timeAxisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeLabelsGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1,
    marginRight: 40,
  },
  timeAxisLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  axisGearBtn: {
    padding: 4,
  },

  /* Chart Footer */
  chartFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateRangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRangeText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  utcClockText: {
    fontSize: 11.5,
    color: '#111827',
    fontWeight: '500',
  },
  chartModeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartModeText: {
    fontSize: 11.5,
    color: '#6B7280',
    marginLeft: 10,
    fontWeight: '500',
  },

  /* BOTTOM TRADING BUTTONS & SENTIMENT */
  bottomBar: {
    paddingHorizontal: 14,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  tradeButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  sellBtn: {
    flex: 1,
    backgroundColor: '#EA3943',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  buyBtn: {
    flex: 1,
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  tradeActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 14,
  },
  tradeActionPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 18,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  spreadBadge: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -24 }, { translateY: -12 }],
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 10,
  },
  spreadText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  sentimentContainer: {
    marginTop: 8,
  },
  sentimentBarsRow: {
    flexDirection: 'row',
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  sentimentBarRed: {
    width: '49%',
    backgroundColor: '#EA3943',
    height: '100%',
  },
  sentimentBarBlue: {
    width: '51%',
    backgroundColor: '#1E88E5',
    height: '100%',
  },
  sentimentLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  sentimentTextRed: {
    fontSize: 11,
    color: '#EA3943',
    fontWeight: '600',
  },
  sentimentTextBlue: {
    fontSize: 11,
    color: '#1E88E5',
    fontWeight: '600',
  },
});
