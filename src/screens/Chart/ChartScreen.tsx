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
import Svg, { Line, Rect, Text as SvgText, G, Circle } from 'react-native-svg';

import * as SecureStore from 'expo-secure-store';
import { useAccount } from '../../context/AccountContext';
import {
  SwitchAccountModal,
  OpenAccountModal,
  ClosePositionModal,
  ChartOrdersModal,
  ModifyOrderModal,
  OneClickTradingModal,
  OrderExecutionModal,
  NewOrderPayload,
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

  // Trading lots on the chart bottom bar
  const [tradingLots, setTradingLots] = useState(4.76);

  // Order execution sheet state (when One-click is disabled)
  const [orderExecutionModal, setOrderExecutionModal] = useState<{
    visible: boolean;
    orderType: 'Buy' | 'Sell';
    pendingPrice: number;
    pendingType: 'Buy Stop' | 'Buy Limit' | 'Sell Stop' | 'Sell Limit';
    isPending: boolean;
    lots: number;
  }>({
    visible: false,
    orderType: 'Buy',
    pendingPrice: 83943.07,
    pendingType: 'Buy Stop',
    isPending: false,
    lots: 4.76,
  });

  // Live prices
  const [bidPrice, setBidPrice] = useState(83751.82);
  const askPrice = parseFloat((bidPrice + 10.0).toFixed(2));
  const orderPnl = ((bidPrice - 83954.32) * 0.01).toFixed(2);
  const [closingOrder, setClosingOrder] = useState<PositionOrder | null>(null);
  const [showOrdersModal, setShowOrdersModal] = useState<boolean>(false);
  const [ordersModalTab, setOrdersModalTab] = useState<'Open' | 'Pending' | 'Closed'>('Open');
  const [modifyingOrder, setModifyingOrder] = useState<PositionOrder | null>(null);

  // Active positions list
  const [activeOrders, setActiveOrders] = useState<PositionOrder[]>([
    {
      id: 'ord-btc-active',
      symbol: symbol || 'BTC',
      type: 'Buy',
      lot: 0.01,
      openPrice: '83954.32',
      currentPrice: '83751.82',
      pnl: '-0.38',
      isProfit: false,
    },
  ]);

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

  const adjustTradingLots = (delta: number) => {
    setTradingLots((prev) => {
      const next = parseFloat((prev + delta).toFixed(2));
      return Math.max(0.01, next);
    });
  };

  const handleSellPress = () => {
    if (oneClickEnabled) {
      const newOrd: PositionOrder = {
        id: `ord-${Date.now()}`,
        symbol: symbol || 'BTC',
        type: 'Sell',
        lot: tradingLots,
        openPrice: bidPrice.toFixed(2),
        currentPrice: bidPrice.toFixed(2),
        pnl: '0.00',
        isProfit: true,
      };
      setActiveOrders((prev) => [newOrd, ...prev]);
    } else {
      setOrderExecutionModal({
        visible: true,
        orderType: 'Sell',
        pendingPrice: parseFloat((bidPrice - 160.0).toFixed(2)),
        pendingType: 'Sell Stop',
        isPending: false,
        lots: tradingLots,
      });
    }
  };

  const handleBuyPress = () => {
    if (oneClickEnabled) {
      const newOrd: PositionOrder = {
        id: `ord-${Date.now()}`,
        symbol: symbol || 'BTC',
        type: 'Buy',
        lot: tradingLots,
        openPrice: askPrice.toFixed(2),
        currentPrice: askPrice.toFixed(2),
        pnl: '0.00',
        isProfit: true,
      };
      setActiveOrders((prev) => [newOrd, ...prev]);
    } else {
      setOrderExecutionModal({
        visible: true,
        orderType: 'Buy',
        pendingPrice: parseFloat((askPrice + 160.0).toFixed(2)),
        pendingType: 'Buy Stop',
        isPending: false,
        lots: tradingLots,
      });
    }
  };

  const handleConfirmOrder = (payload: NewOrderPayload) => {
    const newOrd: PositionOrder = {
      id: `ord-${Date.now()}`,
      symbol: payload.symbol,
      type: payload.orderType,
      lot: payload.lot,
      openPrice: payload.price.toFixed(2),
      currentPrice: payload.orderType === 'Buy' ? askPrice.toFixed(2) : bidPrice.toFixed(2),
      pnl: '0.00',
      isProfit: true,
    };
    setActiveOrders((prev) => [newOrd, ...prev]);
    setOrderExecutionModal((prev) => ({ ...prev, visible: false }));
  };

  const handleCloseAll = () => {
    if (oneClickEnabled) {
      setActiveOrders([]);
    } else {
      if (activeOrders.length > 0) {
        setClosingOrder(activeOrders[0]);
      }
    }
  };

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
      const tick = Math.random() * 4 - 2;
      setBidPrice((prev) => parseFloat((prev + tick).toFixed(2)));
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
  const previewPrice = orderExecutionModal.isPending
    ? orderExecutionModal.pendingPrice
    : orderExecutionModal.orderType === 'Buy'
    ? askPrice
    : bidPrice;
  const previewLineY = getYForPrice(previewPrice);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP PULL-DOWN HANDLE */}
      <View style={styles.topHandleContainer}>
        <View style={styles.topHandle} />
      </View>

      {/* HEADER BAR (Row 1): One-click switch | Account Capsule | Settings & Close */}
      <View style={styles.headerBar}>
        {/* Left: One-Click Trading Toggle Switch (1:1 with Image 1) */}
        <TouchableOpacity
          style={[
            styles.oneClickSwitchTrack,
            oneClickEnabled && styles.oneClickSwitchTrackActive,
          ]}
          activeOpacity={0.8}
          onPress={handleToggleOneClick}
        >
          <View
            style={[
              styles.oneClickSwitchThumb,
              oneClickEnabled && styles.oneClickSwitchThumbActive,
            ]}
          >
            <Ionicons
              name="flash"
              size={12}
              color={oneClickEnabled ? '#5E7182' : '#9CA3AF'}
            />
          </View>
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
            {activeAccount.balance} USD :
          </Text>
        </TouchableOpacity>

        {/* Right: Settings Icon */}
        <View style={styles.headerRightActions}>
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

      {/* FLOATING ORDERS SUMMARY BAR (Row 2 - 1:1 with Image 1) */}
      {activeOrders.length > 0 && (
        <View style={styles.ordersSummaryBar}>
          <TouchableOpacity
            style={styles.ordersSummaryCapsule}
            activeOpacity={0.8}
            onPress={() => {
              setOrdersModalTab('Open');
              setShowOrdersModal(true);
            }}
          >
            <Text style={styles.ordersLabel}>Open</Text>
            <View style={styles.countBadgeActive}>
              <Text style={styles.countBadgeText}>{activeOrders.length}</Text>
            </View>
            <Text
              style={[
                styles.summaryPnlText,
                { color: parseFloat(orderPnl) >= 0 ? '#10B981' : '#EF4444' },
              ]}
            >
              {orderPnl} USD
            </Text>
          </TouchableOpacity>

          {/* Close all circular button with badge (matching Image 1) */}
          <View style={styles.closeAllWrapper}>
            <TouchableOpacity
              style={styles.closeAllCircle}
              activeOpacity={0.7}
              onPress={handleCloseAll}
            >
              <Ionicons name="close" size={16} color="#111827" />
              <View style={styles.closeAllCountBadge}>
                <Text style={styles.closeAllCountText}>{activeOrders.length}</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.closeAllLabel}>Close all</Text>
          </View>
        </View>
      )}

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

            {/* LIVE ORDER HORIZONTAL LINE */}
            {activeOrders.length > 0 && !orderExecutionModal.visible && (
              <Line
                x1="0"
                y1={orderLineY}
                x2={chartWidth}
                y2={orderLineY}
                stroke="#1E88E5"
                strokeWidth="1"
              />
            )}

            {/* PREVIEW ORDER HORIZONTAL LINE (Images 2, 3, 4) */}
            {orderExecutionModal.visible && (
              <>
                <Line
                  x1="0"
                  y1={previewLineY}
                  x2={chartWidth}
                  y2={previewLineY}
                  stroke="#1E88E5"
                  strokeWidth="1"
                />
                <Circle
                  cx={chartWidth * 0.7}
                  cy={previewLineY}
                  r="3.5"
                  fill="#1E88E5"
                />
              </>
            )}

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
            {activeOrders.length > 0 && !orderExecutionModal.visible && (
              <View style={[styles.orderPriceTagAxis, { top: orderLineY - 10 }]}>
                <Text style={styles.orderPriceTagAxisText}>83,954.32</Text>
              </View>
            )}

            {/* Preview Order Price Tag on Axis (Images 2, 3, 4) */}
            {orderExecutionModal.visible && (
              <View style={[styles.orderPriceTagAxis, { top: previewLineY - 10 }]}>
                <Text style={styles.orderPriceTagAxisText}>{previewPrice.toFixed(2)}</Text>
              </View>
            )}

            {/* Ask Price Tag on Axis (White with Blue outline) */}
            <View style={[styles.askPriceTagAxis, { top: getYForPrice(askPrice) - 10 }]}>
              <Text style={styles.askPriceTagAxisText}>{askPrice.toFixed(2)}</Text>
            </View>

            {/* Current Live Bid Price Tag on Axis (Red filled) */}
            <View style={[styles.bidPriceTagAxis, { top: currentBidY - 10 }]}>
              <Text style={styles.bidPriceTagAxisText}>{bidPrice.toFixed(2)}</Text>
            </View>
          </View>

          {/* FLOATING ORDER ACTION CHIPS ON THE ACTIVE ORDER LINE */}
          {activeOrders.length > 0 && !orderExecutionModal.visible && (
            <View style={[styles.orderLineFloatingRow, { top: orderLineY - 14 }]}>
              <View style={styles.tpBox}>
                <Text style={styles.tpText}>TP</Text>
              </View>
              <View style={styles.slBox}>
                <Text style={styles.slText}>SL</Text>
              </View>
              <View style={styles.orderPillContainer}>
                <View style={styles.orderLotTag}>
                  <Text style={styles.orderLotTagText}>{activeOrders[0].lot}</Text>
                </View>
                <View style={styles.orderPnlBox}>
                  <Text style={styles.orderPnlBoxText}>{orderPnl} USD</Text>
                </View>
                <TouchableOpacity
                  style={styles.orderCloseBtn}
                  activeOpacity={0.7}
                  onPress={() => setClosingOrder(activeOrders[0])}
                >
                  <Ionicons name="close" size={14} color="#1E88E5" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* FLOATING ACTION PILL ON PREVIEW ORDER LINE (Images 2, 3, 4) */}
          {orderExecutionModal.visible && (
            <View style={[styles.orderLineFloatingRow, { top: previewLineY - 14 }]}>
              <View style={styles.tpBox}>
                <Text style={styles.tpText}>TP</Text>
              </View>
              <View style={styles.slBox}>
                <Text style={styles.slText}>SL</Text>
              </View>
              <View style={styles.orderPillContainer}>
                <View style={styles.orderLotTag}>
                  <Text style={styles.orderLotTagText}>
                    {orderExecutionModal.lots.toFixed(2)}
                  </Text>
                </View>

                {orderExecutionModal.isPending && (
                  <View style={styles.orderPendingTypeBox}>
                    <Text style={styles.orderPendingTypeText}>
                      {orderExecutionModal.pendingType}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.orderCloseBtn}
                  activeOpacity={0.7}
                  onPress={() => setOrderExecutionModal((prev) => ({ ...prev, visible: false }))}
                >
                  <Ionicons name="close" size={14} color="#1E88E5" />
                </TouchableOpacity>
              </View>
            </View>
          )}
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

      {/* BOTTOM TRADING ACTION BAR: Sell | Lots Stepper | Buy (1:1 with Image 1) */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.tradeButtonsRow}>
          {/* SELL BUTTON (Red) */}
          <TouchableOpacity
            style={styles.sellBtn}
            activeOpacity={0.88}
            onPress={handleSellPress}
          >
            <Text style={styles.tradeActionTitle}>Sell</Text>
            <Text style={styles.tradeActionPrice}>{bidPrice.toFixed(2)}</Text>
          </TouchableOpacity>

          {/* LOTS STEPPER CONTAINER (Center) */}
          <View style={styles.lotStepperBox}>
            <TouchableOpacity
              style={styles.lotStepBtn}
              onPress={() => adjustTradingLots(-0.01)}
              activeOpacity={0.6}
            >
              <Ionicons name="remove" size={16} color="#4B5563" />
            </TouchableOpacity>

            <View style={styles.lotCenterCol}>
              <Text style={styles.lotLabelSmall}>Lots</Text>
              <Text style={styles.lotValueBold}>{tradingLots.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={styles.lotStepBtn}
              onPress={() => adjustTradingLots(0.01)}
              activeOpacity={0.6}
            >
              <Ionicons name="add" size={16} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* BUY BUTTON (Blue) */}
          <TouchableOpacity
            style={styles.buyBtn}
            activeOpacity={0.88}
            onPress={handleBuyPress}
          >
            <Text style={styles.tradeActionTitle}>Buy</Text>
            <Text style={styles.tradeActionPrice}>{askPrice.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>

        {/* BOTTOM METRICS INFO ROW: Spread | Fees | Margin (1:400) + (i) icon */}
        <View style={styles.tradeMetricsRow}>
          <Text style={styles.tradeMetricsText}>
            Spread: 10.00 | Fees: ~ {(tradingLots * 10.0).toFixed(2)} USD | Margin: {((tradingLots * bidPrice) / 400).toFixed(2)} USD{'\n'}(1:400)
          </Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
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
        orders={activeOrders}
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

      {/* Order Execution Sheet (Market & Pending Order Confirmation) */}
      <OrderExecutionModal
        visible={orderExecutionModal.visible}
        orderType={orderExecutionModal.orderType}
        symbol={symbol || 'BTC'}
        currentMarketPrice={orderExecutionModal.orderType === 'Buy' ? askPrice : bidPrice}
        initialLots={tradingLots}
        leverage={400}
        onClose={() => setOrderExecutionModal((prev) => ({ ...prev, visible: false }))}
        onConfirmOrder={handleConfirmOrder}
        onPendingPriceChange={(price, pendingType) => {
          setOrderExecutionModal((prev) => {
            if (prev.pendingPrice === price && prev.pendingType === pendingType && prev.isPending) {
              return prev;
            }
            return {
              ...prev,
              pendingPrice: price,
              pendingType,
              isPending: true,
            };
          });
        }}
        onTabChange={(tab) => {
          setOrderExecutionModal((prev) => {
            const isPend = tab === 'Pending';
            if (prev.isPending === isPend) return prev;
            return { ...prev, isPending: isPend };
          });
        }}
        onLotsChange={(lots) => {
          setOrderExecutionModal((prev) => {
            if (prev.lots === lots) return prev;
            return { ...prev, lots };
          });
        }}
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
  oneClickSwitchTrack: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
    alignItems: 'flex-start',
  },
  oneClickSwitchTrackActive: {
    backgroundColor: '#5E7182',
    alignItems: 'flex-end',
  },
  oneClickSwitchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 2,
  },
  oneClickSwitchThumbActive: {
    backgroundColor: '#FFFFFF',
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
    paddingHorizontal: 14,
    marginTop: 4,
    marginBottom: 4,
  },
  ordersSummaryCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  closeAllWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeAllCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeAllCountBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeAllCountText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#111827',
  },
  closeAllLabel: {
    fontSize: 10,
    color: '#4B5563',
    marginTop: 2,
    fontWeight: '500',
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
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  buyBtn: {
    flex: 1,
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  lotStepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 6,
    marginHorizontal: 8,
    minWidth: 96,
    backgroundColor: '#FFFFFF',
  },
  lotStepBtn: {
    width: 26,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lotCenterCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  lotLabelSmall: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  lotValueBold: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  tradeMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  tradeMetricsText: {
    fontSize: 11.5,
    color: '#6B7280',
    lineHeight: 16,
  },
  tradeActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 14,
  },
  tradeActionPrice: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 18,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  orderPendingTypeBox: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderLeftWidth: 1,
    borderColor: '#1E88E5',
  },
  orderPendingTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E88E5',
  },
});
