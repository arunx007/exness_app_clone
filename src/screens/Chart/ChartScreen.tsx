import React, { useState, useEffect, useMemo } from 'react';
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
import { useTradingData } from '../../context/TradingDataContext';
import {
  SwitchAccountModal,
  OpenAccountModal,
  ClosePositionModal,
  ChartOrdersModal,
  ModifyOrderModal,
  OneClickTradingModal,
  OrderExecutionModal,
  SymbolPickerModal,
  NewOrderPayload,
} from '../../components/modals';
import { PositionOrder } from '../../components/cards/OrderCard';
import { TradingViewChart } from '../../components/chart/TradingViewChart';
import { SymbolIcon } from '../../components/common/SymbolIcon';
import { DEFAULT_CATALOG_SYMBOLS } from '../../constants/symbolsCatalog';
import { marketSymbolsMatch } from '../../utils/symbol';

import { useMarketQuotes } from '../../hooks/useMarketQuotes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChartScreenProps {
  symbol?: string;
  onClose?: () => void;
}

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1D'];

export const ChartScreen: React.FC<ChartScreenProps> = ({
  symbol = 'BTCUSD',
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { accounts, activeAccount, setActiveAccount, addAccount } = useAccount();

  // Dynamic instrument symbol state
  const [currentSymbol, setCurrentSymbol] = useState(symbol || 'BTCUSD');
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);

  useEffect(() => {
    if (symbol && symbol !== currentSymbol) {
      setCurrentSymbol(symbol);
    }
  }, [symbol]);

  const catalogEntry = useMemo(() => {
    return (
      DEFAULT_CATALOG_SYMBOLS.find((s) => marketSymbolsMatch(s.symbol, currentSymbol)) ??
      DEFAULT_CATALOG_SYMBOLS[0]
    );
  }, [currentSymbol]);

  const digits = catalogEntry.digits ?? 2;
  const spread = catalogEntry.spread ?? (digits === 5 ? 0.00015 : 10.0);
  const [bidPrice, setBidPrice] = useState(catalogEntry.bid);
  const askPrice = parseFloat((bidPrice + spread).toFixed(digits));

  useEffect(() => {
    setBidPrice(catalogEntry.bid);
  }, [catalogEntry]);

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

  const {
    positions,
    orders,
    history,
    placeMarketOrder,
    placePendingOrder,
    modifyPosition,
    modifyPendingOrder,
    closePosition,
    closeAllPositions,
    closeProfitablePositions,
    cancelPendingOrder,
    refresh: refreshTrading,
  } = useTradingData();

  // Active positions list mapped dynamically from TradingDataContext
  const activeOrders: PositionOrder[] = useMemo(() => {
    return positions.map((p) => {
      const pnl = p.profit;
      const isProfit = pnl >= 0;
      return {
        id: String(p.ticket),
        symbol: p.symbol,
        type: p.type === 'BUY' ? 'Buy' : 'Sell',
        lot: p.volume,
        openPrice: p.openPrice.toFixed(2),
        currentPrice: p.currentPrice.toFixed(2),
        pnl: `${isProfit ? '+' : ''}${pnl.toFixed(2)}`,
        isProfit,
      };
    });
  }, [positions]);

  const totalPnlNumber = useMemo(() => {
    return positions.reduce((sum, p) => sum + p.profit, 0);
  }, [positions]);

  const totalPnlFormatted = `${totalPnlNumber >= 0 ? '+' : ''}${totalPnlNumber.toFixed(2)}`;

  const profitablePositionsCount = useMemo(() => {
    return positions.filter((p) => p.profit > 0).length;
  }, [positions]);

  const primaryPosition = positions[0];
  const orderPnl = primaryPosition
    ? `${primaryPosition.profit >= 0 ? '+' : ''}${primaryPosition.profit.toFixed(2)}`
    : totalPnlFormatted;
  const [closingOrder, setClosingOrder] = useState<PositionOrder | null>(null);
  const [showOrdersModal, setShowOrdersModal] = useState<boolean>(false);
  const [ordersModalTab, setOrdersModalTab] = useState<'Open' | 'Pending' | 'Closed'>('Open');
  const [modifyingOrder, setModifyingOrder] = useState<PositionOrder | null>(null);

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

  const handleSellPress = async () => {
    if (oneClickEnabled) {
      await placeMarketOrder({
        symbol: currentSymbol,
        side: 'SELL',
        volume: tradingLots,
      });
    } else {
      const tick = Math.pow(10, -digits) * 15;
      setOrderExecutionModal({
        visible: true,
        orderType: 'Sell',
        pendingPrice: parseFloat((bidPrice - tick).toFixed(digits)),
        pendingType: 'Sell Stop',
        isPending: false,
        lots: tradingLots,
      });
    }
  };

  const handleBuyPress = async () => {
    if (oneClickEnabled) {
      await placeMarketOrder({
        symbol: currentSymbol,
        side: 'BUY',
        volume: tradingLots,
      });
    } else {
      const tick = Math.pow(10, -digits) * 15;
      setOrderExecutionModal({
        visible: true,
        orderType: 'Buy',
        pendingPrice: parseFloat((askPrice + tick).toFixed(digits)),
        pendingType: 'Buy Stop',
        isPending: false,
        lots: tradingLots,
      });
    }
  };

  const handleConfirmOrder = async (payload: NewOrderPayload) => {
    setOrderExecutionModal((prev) => ({ ...prev, visible: false }));
    if (payload.executionType === 'Market') {
      await placeMarketOrder({
        symbol: payload.symbol,
        side: payload.orderType === 'Buy' ? 'BUY' : 'SELL',
        volume: payload.lot,
        stopLoss: payload.stopLoss,
        takeProfit: payload.takeProfit,
      });
    } else {
      let pendingType: 'BuyLimit' | 'BuyStop' | 'SellLimit' | 'SellStop';
      if (payload.orderType === 'Buy') {
        pendingType = payload.executionType === 'Limit' ? 'BuyLimit' : 'BuyStop';
      } else {
        pendingType = payload.executionType === 'Limit' ? 'SellLimit' : 'SellStop';
      }
      await placePendingOrder({
        symbol: payload.symbol,
        type: pendingType,
        volume: payload.lot,
        price: payload.price,
        stopLoss: payload.stopLoss,
        takeProfit: payload.takeProfit,
      });
    }
  };

  const handleCloseAll = async () => {
    if (oneClickEnabled) {
      await closeAllPositions();
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

  // Stream live real-time market quotes directly from MT5 socket
  const marketQuotes = useMarketQuotes([currentSymbol]);
  useEffect(() => {
    const live = marketQuotes[currentSymbol] || Object.values(marketQuotes)[0];
    if (live && live.bid > 0) {
      setBidPrice(live.bid);
    }
  }, [marketQuotes, currentSymbol]);

  return (
    <View style={[styles.container, { paddingTop: orderExecutionModal.visible ? Math.max(insets.top, 8) : insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP PULL-DOWN HANDLE & HEADER: Hidden when sheet is open because of limited vertical space */}
      {!orderExecutionModal.visible && (
        <>
          <View style={styles.topHandleContainer}>
            <View style={styles.topHandle} />
          </View>

          {/* HEADER BAR (Row 1): Dynamic Symbol | Account Capsule | One-Click switch & Close */}
          <View style={styles.headerBar}>
            {/* Left: Dynamic Symbol selector with Icon + Name + Chevron */}
            <TouchableOpacity
              style={styles.symbolSelectorBtn}
              activeOpacity={0.7}
              onPress={() => setShowSymbolPicker(true)}
            >
              <SymbolIcon symbol={currentSymbol} size={28} />
              <Text style={styles.symbolSelectorText}>
                {currentSymbol.includes('.') ? currentSymbol.split('.')[0] : currentSymbol}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#111827" style={{ marginLeft: 3 }} />
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
                {activeAccount.balance} USD
              </Text>
            </TouchableOpacity>

            {/* Right Actions: One-Click Toggle & Close Button */}
            <View style={styles.headerRightActions}>
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
                    size={11}
                    color={oneClickEnabled ? '#5E7182' : '#9CA3AF'}
                  />
                </View>
              </TouchableOpacity>

              {onClose && (
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.headerIconBtn, { marginLeft: 6 }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={22} color="#111827" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      )}

      {/* FLOATING ORDERS SUMMARY BAR (Row 2 - Hidden when sheet is open) */}
      {!orderExecutionModal.visible && activeOrders.length > 0 && (
        oneClickEnabled ? (
          /* Image 2: One-click ENABLED */
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

            <View style={styles.oneClickActionBtnsGroup}>
              {/* Close profitable circular button with badge (Image 2) */}
              <View style={styles.closeBtnWrapper}>
                <TouchableOpacity
                  style={styles.closeProfitableCircle}
                  activeOpacity={0.7}
                  onPress={async () => {
                    await closeProfitablePositions();
                  }}
                >
                  <Ionicons name="checkmark" size={17} color="#10B981" />
                  <View style={styles.closeProfitableBadge}>
                    <Text style={styles.closeProfitableBadgeText}>
                      {profitablePositionsCount}
                    </Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.closeActionLabel}>Close profitable</Text>
              </View>

              {/* Close all circular button with badge (Image 2) */}
              <View style={styles.closeBtnWrapper}>
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
                <Text style={styles.closeActionLabel}>Close all</Text>
              </View>
            </View>
          </View>
        ) : (
          /* Image 1: One-click DISABLED */
          <View style={styles.ordersSummaryBarDisabled}>
            <View style={styles.openPendingTabsGroup}>
              <TouchableOpacity
                style={styles.openTabBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setOrdersModalTab('Open');
                  setShowOrdersModal(true);
                }}
              >
                <Text style={styles.openTabLabel}>Open</Text>
                <View style={styles.openCountBadge}>
                  <Text style={styles.openCountBadgeText}>{activeOrders.length}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pendingTabBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setOrdersModalTab('Pending');
                  setShowOrdersModal(true);
                }}
              >
                <Text style={styles.pendingTabLabel}>Pending</Text>
                <View style={styles.pendingCountBadge}>
                  <Text style={styles.pendingCountBadgeText}>{orders.length}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.disabledPnlCloseRow}>
              <Text
                style={[
                  styles.disabledPnlText,
                  { color: parseFloat(orderPnl) >= 0 ? '#10B981' : '#EF4444' },
                ]}
              >
                {orderPnl} USD
              </Text>
              <TouchableOpacity
                style={styles.disabledCloseIconBtn}
                activeOpacity={0.7}
                onPress={handleCloseAll}
              >
                <Ionicons name="close" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        )
      )}

      {/* DEDICATED TRADINGVIEW CHART CONTAINER AREA */}
      <View style={styles.tradingViewChartContainer}>
        {/* Real Interactive TradingView Chart */}
        <TradingViewChart
          symbol={currentSymbol}
          resolution={
            selectedTimeframe === '1m'
              ? '1'
              : selectedTimeframe === '5m'
              ? '5'
              : selectedTimeframe === '15m'
              ? '15'
              : selectedTimeframe === '30m'
              ? '30'
              : selectedTimeframe === '1h'
              ? '60'
              : selectedTimeframe === '4h'
              ? '240'
              : '1D'
          }
          onResolutionChange={(res) => {
            const revMap: Record<string, string> = {
              '1': '1m',
              '5': '5m',
              '15': '15m',
              '30': '30m',
              '60': '1h',
              '240': '4h',
              '1D': '1D',
              D: '1D',
            };
            if (revMap[res]) setSelectedTimeframe(revMap[res]);
          }}
          onLiveQuote={(q) => {
            if (q.bid > 0) setBidPrice(q.bid);
          }}
          previewOrder={
            orderExecutionModal.visible
              ? {
                  side: orderExecutionModal.orderType,
                  price: orderExecutionModal.pendingPrice,
                  lots: orderExecutionModal.lots,
                  type: orderExecutionModal.isPending ? 'stop' : 'limit',
                }
              : null
          }
          onPreviewChange={(change) => {
            setOrderExecutionModal((prev) => ({
              ...prev,
              pendingPrice: change.price,
            }));
          }}
        />

        {/* Floating Timeframe Picker Popup */}
        {showTimeframePicker && (
          <View style={styles.timeframePickerPopup}>
            {['1m', '5m', '15m', '30m', '1h', '4h', '1D'].map((tf) => (
              <TouchableOpacity
                key={tf}
                style={[
                  styles.timeframeOptionItem,
                  selectedTimeframe === tf && styles.timeframeOptionItemActive,
                ]}
                onPress={() => {
                  setSelectedTimeframe(tf);
                  setShowTimeframePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.timeframeOptionText,
                    selectedTimeframe === tf && styles.timeframeOptionTextActive,
                  ]}
                >
                  {tf}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* BOTTOM TRADING ACTION BAR: Hidden when orderExecutionModal is open */}
      {!orderExecutionModal.visible && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {oneClickEnabled ? (
            /* Image 2: One-click ENABLED */
            <>
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
            </>
          ) : (
            /* Image 1: One-click DISABLED */
            <>
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

                {/* SPREAD BADGE (Center - Image 1) */}
                <View style={styles.spreadBoxDisabled}>
                  <Text style={styles.spreadBoxDisabledText}>10.00</Text>
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

              {/* SENTIMENT BAR (Image 1: 47% Red | 53% Blue) */}
              <View style={styles.sentimentContainer}>
                <View style={styles.sentimentBarsRow}>
                  <View style={[styles.sentimentBarFillRed, { flex: 47 }]} />
                  <View style={{ width: 8 }} />
                  <View style={[styles.sentimentBarFillBlue, { flex: 53 }]} />
                </View>
                <View style={styles.sentimentLabelsRow}>
                  <Text style={styles.sentimentLabelRed}>47%</Text>
                  <Text style={styles.sentimentLabelBlue}>53%</Text>
                </View>
              </View>
            </>
          )}
        </View>
      )}

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
        onConfirm={async () => {
          if (closingOrder) {
            const ticket = parseInt(closingOrder.id.replace('ord-btc-', '').replace('ord-', ''), 10) || 7730671;
            await closePosition(ticket, closingOrder.lot, closingOrder.symbol);
            void refreshTrading();
            setClosingOrder(null);
          }
        }}
        onCancel={() => setClosingOrder(null)}
      />

      {/* Chart Orders Modal (1:1 with media_1790359184602.jpg) */}
      <ChartOrdersModal
        visible={showOrdersModal}
        orders={activeOrders}
        pendingOrders={orders.map((o) => ({
          ticket: o.ticket,
          symbol: o.symbol,
          type: o.type,
          volume: o.volume,
          price: o.price.toFixed(2),
          openTime: o.openTime,
        }))}
        closedOrders={history.map((h) => ({
          id: String(h.ticket),
          symbol: h.symbol,
          type: h.type === 'BUY' ? 'Buy' : 'Sell',
          lot: h.volume,
          openPrice: h.openPrice.toFixed(2),
          closePrice: h.closePrice.toFixed(2),
          pnl: `${h.profit >= 0 ? '+' : ''}${h.profit.toFixed(2)}`,
          isProfit: h.profit >= 0,
        }))}
        initialTab={ordersModalTab}
        onClose={() => setShowOrdersModal(false)}
        onCancelPending={async (ticket) => {
          await cancelPendingOrder(ticket);
        }}
        onOrderPress={(ord) => {
          setShowOrdersModal(false);
          setModifyingOrder(ord);
        }}
      />

      {/* Modify Order Modal */}
      <ModifyOrderModal
        visible={modifyingOrder !== null}
        order={modifyingOrder}
        onConfirmModify={async (params) => {
          await modifyPosition(params);
          void refreshTrading();
        }}
        onPartialClose={async ({ ticket, volume, symbol }) => {
          await closePosition(ticket, volume, symbol);
          void refreshTrading();
        }}
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
        symbol={currentSymbol}
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  symbolSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 2,
    flexShrink: 0,
  },
  symbolSelectorText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  oneClickSwitchTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
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
    width: 20,
    height: 20,
    borderRadius: 10,
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
    paddingVertical: 3.5,
    paddingLeft: 5,
    paddingRight: 8,
    marginHorizontal: 2,
    flexShrink: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  demoChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 5,
  },
  demoBg: {
    backgroundColor: '#E6F7EC',
  },
  realBg: {
    backgroundColor: '#FFF8E1',
  },
  demoChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  demoColor: {
    color: '#0A8754',
  },
  realColor: {
    color: '#B45309',
  },
  balanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
  },
  headerIconBtn: {
    padding: 4,
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

  /* Minimal Header when Sheet is Open (Image 3) */
  headerBarSheetOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  sheetHeaderSymbolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  symbolIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  symbolIconText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sheetHeaderSymbolText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  /* One-click toggle container with label (Image 1) */
  oneClickLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oneClickLabelText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    marginLeft: 6,
  },

  /* Open / Pending Orders Row for One-Click Disabled (Image 1) */
  ordersSummaryBarDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    marginHorizontal: 14,
    marginVertical: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  openPendingTabsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
  },
  openTabLabel: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#111827',
    marginRight: 4,
  },
  openCountBadge: {
    backgroundColor: '#5C748C',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  openCountBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  pendingTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pendingTabLabel: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 4,
  },
  pendingCountBadge: {
    backgroundColor: '#9CA3AF',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  pendingCountBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  disabledPnlCloseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledPnlText: {
    fontSize: 13.5,
    fontWeight: '700',
    marginRight: 8,
  },
  disabledCloseIconBtn: {
    padding: 3,
    marginRight: 2,
  },

  /* One-Click Action Buttons: Close Profitable + Close All (Image 2) */
  oneClickActionBtnsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeProfitableCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F7EC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeProfitableBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#0A8754',
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeProfitableBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeActionLabel: {
    fontSize: 9.5,
    color: '#4B5563',
    marginTop: 2,
    fontWeight: '500',
  },

  /* Spread Badge in Center when One-Click is Disabled (Image 1) */
  spreadBoxDisabled: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
  spreadBoxDisabledText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    fontVariant: ['tabular-nums'],
  },

  /* Sentiment Indicator Bar (Image 1) */
  sentimentContainer: {
    marginTop: 8,
    paddingHorizontal: 2,
  },
  sentimentBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 4,
  },
  sentimentBarFillRed: {
    height: 3,
    backgroundColor: '#EF4444',
    borderRadius: 1.5,
  },
  sentimentBarFillBlue: {
    height: 3,
    backgroundColor: '#1E88E5',
    borderRadius: 1.5,
  },
  sentimentLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sentimentLabelRed: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  sentimentLabelBlue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E88E5',
  },
  timeframePickerPopup: {
    position: 'absolute',
    top: 6,
    left: 48,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeframeOptionItem: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5,
    marginHorizontal: 2,
  },
  timeframeOptionItemActive: {
    backgroundColor: '#EFF6FF',
  },
  timeframeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  timeframeOptionTextActive: {
    color: '#1E88E5',
    fontWeight: '700',
  },
});
