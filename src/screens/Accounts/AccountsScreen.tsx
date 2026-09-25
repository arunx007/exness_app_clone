import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { AccountDetailsModal } from './AccountDetailsModal';
import { OrderCard, PositionOrder } from '../../components/cards/OrderCard';
import { SymbolIcon } from '../../components/common/SymbolIcon';
import {
  ClosePositionModal,
  ModifyOrderModal,
  ClosedOrderDetailsModal,
  ClosedOrder,
  ThreeDotsDropdown,
  SwitchAccountModal,
  OpenAccountModal,
  VerifyContactDetailsModal,
  AccountItem,
} from '../../components/modals';
import { useAccount } from '../../context/AccountContext';
import { useTradingData } from '../../context/TradingDataContext';
import { ChartScreen } from '../Chart/ChartScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INITIAL_ACCOUNTS: AccountItem[] = [
  {
    id: 'demo-15000113413',
    accountNumber: '15000113413',
    type: 'Demo',
    server: 'Exness',
    plan: 'Standard',
    balance: '9,996.50',
    currency: 'USD',
  },
  {
    id: 'real-14000102647',
    accountNumber: '14000102647',
    type: 'Real',
    server: 'Exness',
    plan: 'Standard',
    balance: '0.00',
    currency: 'USD',
  },
];

interface QuickInstrument {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  type: 'forex' | 'crypto' | 'commodity';
}

const QUICK_INSTRUMENTS: QuickInstrument[] = [
  {
    symbol: 'XAU/USD',
    price: '4285.467',
    change: '+0.48%',
    isPositive: true,
    type: 'commodity',
  },
  {
    symbol: 'BTC',
    price: '83709.55',
    change: '-0.8%',
    isPositive: false,
    type: 'crypto',
  },
  {
    symbol: 'USOIL',
    price: '91.032',
    change: '-1.96%',
    isPositive: false,
    type: 'commodity',
  },
];

export const AccountsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'Open' | 'Pending' | 'Closed'>('Open');
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [closingOrder, setClosingOrder] = useState<PositionOrder | null>(null);
  const [modifyingOrder, setModifyingOrder] = useState<PositionOrder | null>(null);
  const [selectedClosedOrder, setSelectedClosedOrder] = useState<ClosedOrder | null>(null);

  const { accounts, activeAccount, setActiveAccount, addAccount } = useAccount();
  const {
    profile,
    positions,
    orders,
    history,
    isLoading: isTradingLoading,
    refresh: refreshTrading,
    closePosition,
    cancelPendingOrder,
  } = useTradingData();

  const isFocused = useIsFocused();
  const [showThreeDotsMenu, setShowThreeDotsMenu] = useState(false);
  const [showSwitchAccount, setShowSwitchAccount] = useState(false);
  const [showOpenAccount, setShowOpenAccount] = useState(false);
  const [showVerifyContactModal, setShowVerifyContactModal] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [selectedChartSymbol, setSelectedChartSymbol] = useState<string>('BTC');

  // Ensure Modals are closed whenever switching tabs or coming back
  useEffect(() => {
    if (!isFocused) {
      setShowChartModal(false);
      setShowVerifyContactModal(false);
    }
  }, [isFocused]);

  const [openOrders, setOpenOrders] = useState<PositionOrder[]>([]);
  const [closedOrders, setClosedOrders] = useState<ClosedOrder[]>([
    {
      id: 'cls-7730675',
      symbol: 'XAUUSD',
      type: 'Buy',
      lot: 0.01,
      openPrice: '2645.32',
      closePrice: '2652.18',
      openTime: '25 Sept 2026 22:45:25',
      closeTime: '25 Sept 2026 22:55:38',
      closedBy: 'User',
      swap: '0.00 USD',
      commission: '0.00 USD',
      stopLoss: '—',
      takeProfit: '—',
      pnl: '+6.86',
      isProfit: true,
    },
  ]);

  const displayBalance = useMemo(() => {
    if (profile?.balance !== undefined && Number.isFinite(profile.balance)) {
      return Number(profile.balance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return activeAccount.balance;
  }, [profile?.balance, activeAccount.balance]);

  const liveOpenOrders: PositionOrder[] = useMemo(() => {
    if (positions.length > 0) {
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
    }
    return [];
  }, [positions]);

  const livePendingOrders = useMemo(() => {
    return orders.map((o) => ({
      id: String(o.ticket),
      ticket: o.ticket,
      symbol: o.symbol,
      type: o.type,
      volume: o.volume,
      price: o.price.toFixed(2),
      openTime: o.openTime,
    }));
  }, [orders]);

  const liveClosedOrders: ClosedOrder[] = useMemo(() => {
    if (history.length > 0) {
      return history.map((h) => {
        const isProfit = h.profit >= 0;
        return {
          id: String(h.ticket),
          symbol: h.symbol,
          type: h.type === 'BUY' ? 'Buy' : 'Sell',
          lot: h.volume,
          openPrice: h.openPrice.toFixed(2),
          closePrice: h.closePrice.toFixed(2),
          openTime: h.time ? new Date(h.time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
          closeTime: h.time ? new Date(h.time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
          closedBy: h.action || 'User',
          swap: `${(h.swap ?? 0).toFixed(2)} USD`,
          commission: `${(h.commission ?? 0).toFixed(2)} USD`,
          stopLoss: '—',
          takeProfit: '—',
          pnl: `${isProfit ? '+' : ''}${h.profit.toFixed(2)}`,
          isProfit,
        };
      });
    }
    return [];
  }, [history]);

  const currentOpenOrders = liveOpenOrders;
  const currentClosedOrders = liveClosedOrders.length > 0 ? liveClosedOrders : closedOrders;

  if (showAccountDetails) {
    return <AccountDetailsModal onClose={() => setShowAccountDetails(false)} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Main Scroll View with stickyHeaderIndices for sticky tabs */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]} // Sticky Order Tabs row
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* TOP SECTION: Header with Accounts title, Clock, Bell, 3-dots */}
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>Accounts</Text>
          <View style={styles.topActionsRow}>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name="time-outline" size={24} color="#111827" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={24} color="#111827" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dotsBtn}
              activeOpacity={0.7}
              onPress={() => setShowThreeDotsMenu(true)}
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        {/* PROFILE COMPLETION BANNER & ACCOUNT CARD */}
        <View style={{ paddingHorizontal: 16 }}>
          {/* Banner */}
          <View style={styles.bannerContainer}>
            <View style={styles.bannerTopRow}>
              {/* Progress Avatar */}
              <View style={styles.avatarCircle}>
                <Ionicons name="person-outline" size={20} color="#111827" />
              </View>

              <Text style={styles.bannerTitle}>
                Hello. Fill in your account details{'\n'}to make your first deposit
              </Text>
            </View>

            <View style={styles.bannerBtnRow}>
              <TouchableOpacity
                style={styles.learnMoreBtn}
                activeOpacity={0.7}
                onPress={() => setShowVerifyContactModal(true)}
              >
                <Text style={styles.learnMoreText}>Learn more</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.completeBtn}
                activeOpacity={0.85}
                onPress={() => setShowVerifyContactModal(true)}
              >
                <Text style={styles.completeText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* White Account Card */}
          <View style={styles.accountCard}>
            {/* Account meta & settings gear */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowAccountDetails(true)}
              style={styles.accountCardHeader}
            >
              <Text style={styles.accountNumberText}>
                {activeAccount.plan} # {activeAccount.accountNumber}
              </Text>
              <View style={styles.gearBtn}>
                <Ionicons name="settings-sharp" size={17} color="#4B5563" />
              </View>
            </TouchableOpacity>

            {/* Chips (Demo/Real, Exness, Standard) */}
            <View style={styles.chipsRow}>
              <View
                style={[
                  styles.chipPill,
                  activeAccount.type === 'Demo' ? styles.demoChipPill : styles.realChipPill,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    activeAccount.type === 'Demo' ? styles.demoChipText : styles.realChipText,
                  ]}
                >
                  {activeAccount.type}
                </Text>
              </View>
              <View style={styles.chipPill}>
                <Text style={styles.chipText}>{activeAccount.server}</Text>
              </View>
              <View style={styles.chipPill}>
                <Text style={styles.chipText}>{activeAccount.plan}</Text>
              </View>
            </View>

            {/* Big Balance */}
            <Text style={styles.balanceText}>
              {displayBalance} {activeAccount.currency}
            </Text>

            {/* Circular Quick Action Buttons (Trade, Deposit, Withdraw) */}
            <View style={styles.quickActionsRow}>
              {/* Trade Action (Yellow circle) */}
              <View style={styles.actionCol}>
                <TouchableOpacity
                  style={styles.tradeYellowCircle}
                  activeOpacity={0.85}
                  onPress={() => setShowChartModal(true)}
                >
                  <Ionicons name="options-outline" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.actionLabel}>Trade</Text>
              </View>

              {/* Deposit Action */}
              <View style={styles.actionCol}>
                <TouchableOpacity style={styles.circleBtn} activeOpacity={0.7}>
                  <Ionicons name="arrow-down-circle-outline" size={26} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.actionLabel}>Deposit</Text>
              </View>

              {/* Withdraw Action */}
              <View style={styles.actionCol}>
                <TouchableOpacity style={styles.circleBtn} activeOpacity={0.7}>
                  <Ionicons name="arrow-up-circle-outline" size={26} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.actionLabel}>Withdraw</Text>
              </View>
            </View>
          </View>
        </View>

        {/* STICKY TABS ROW: Open | Pending | Closed + Sort Icon */}
        <View style={styles.stickyTabsWrapper}>
          <View style={styles.stickyTabsContainer}>
            <View style={styles.tabButtonsRow}>
              <TouchableOpacity
                onPress={() => setActiveTab('Open')}
                style={[styles.tabButton, activeTab === 'Open' && styles.tabButtonActive]}
              >
                <View style={styles.tabButtonInner}>
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === 'Open' ? styles.tabTextActive : styles.tabTextInactive,
                    ]}
                  >
                    Open
                  </Text>
                  {currentOpenOrders.length > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{currentOpenOrders.length}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('Pending')}
                style={[styles.tabButton, activeTab === 'Pending' && styles.tabButtonActive]}
              >
                <View style={styles.tabButtonInner}>
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === 'Pending' ? styles.tabTextActive : styles.tabTextInactive,
                    ]}
                  >
                    Pending
                  </Text>
                  {livePendingOrders.length > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{livePendingOrders.length}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('Closed')}
                style={[styles.tabButton, activeTab === 'Closed' && styles.tabButtonActive]}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === 'Closed' ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                >
                  Closed
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sort up-down icon */}
            <TouchableOpacity style={styles.sortButton} activeOpacity={0.7}>
              <Ionicons name="swap-vertical" size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>
          <View style={styles.tabsUnderline} />
        </View>

        {/* ORDERS CONTENT & NEXT TRADES CAROUSEL */}
        <View style={styles.ordersContent}>
          {activeTab === 'Open' ? (
            currentOpenOrders.length > 0 ? (
              <View>
                {/* Total P/L Row */}
                <View style={styles.totalPnlRow}>
                  <Text style={styles.totalPnlLabel}>Total P/L</Text>
                  <Text
                    style={[
                      styles.totalPnlValue,
                      {
                        color:
                          currentOpenOrders.reduce((sum, ord) => sum + parseFloat(ord.pnl), 0) >= 0
                            ? '#10B981'
                            : '#EF4444',
                      },
                    ]}
                  >
                    {currentOpenOrders
                      .reduce((sum, ord) => sum + parseFloat(ord.pnl), 0)
                      .toFixed(2)}{' '}
                    USD
                  </Text>
                </View>

                {/* Order Cards */}
                {currentOpenOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onPress={() => setModifyingOrder(order)}
                    onModify={() => setModifyingOrder(order)}
                    onClose={() => {
                      setClosingOrder(order);
                    }}
                  />
                ))}
              </View>
            ) : (
              <View>
                <Text style={styles.noOrdersText}>
                  No open orders. Find your next trade:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalInstrumentsList}
                >
                  {QUICK_INSTRUMENTS.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      style={styles.instrumentCard}
                      onPress={() => {
                        setSelectedChartSymbol(item.symbol);
                        setShowChartModal(true);
                      }}
                    >
                      <Text style={styles.instrumentSymbol}>{item.symbol}</Text>
                      <View style={styles.instrumentIconRow}>
                        <SymbolIcon symbol={item.symbol} size={28} />
                      </View>
                      <Text style={styles.instrumentPrice}>{item.price}</Text>
                      <View
                        style={[
                          styles.changePill,
                          {
                            backgroundColor: item.isPositive ? '#EFF6FF' : '#FEF2F2',
                          },
                        ]}
                      >
                        <Ionicons
                          name={item.isPositive ? 'arrow-up' : 'arrow-down'}
                          size={12}
                          color={item.isPositive ? '#2563EB' : '#DC2626'}
                          style={{ marginRight: 2 }}
                        />
                        <Text
                          style={[
                            styles.changePillText,
                            { color: item.isPositive ? '#2563EB' : '#DC2626' },
                          ]}
                        >
                          {item.change}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )
          ) : activeTab === 'Pending' ? (
            livePendingOrders.length > 0 ? (
              <View style={{ paddingHorizontal: 16 }}>
                {livePendingOrders.map((ord) => (
                  <View key={ord.id} style={styles.pendingCard}>
                    <View style={styles.pendingLeftRow}>
                      <View style={styles.symbolIconWrapper}>
                        <SymbolIcon symbol={ord.symbol} size={34} />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.closedSymbol}>{ord.symbol}</Text>
                        <Text style={styles.closedOrderTypeLot}>
                          <Text style={styles.buyText}>{ord.type.replace('_', ' ')} {ord.volume} lot</Text> at {ord.price}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.cancelPendingBtn}
                      activeOpacity={0.7}
                      onPress={() => cancelPendingOrder(ord.ticket)}
                    >
                      <Text style={styles.cancelPendingText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyPendingContainer}>
                <Ionicons name="hourglass-outline" size={40} color="#9CA3AF" style={{ marginBottom: 12 }} />
                <Text style={styles.noOrdersText}>No pending orders currently active.</Text>
              </View>
            )
          ) : (
            <View>
              {/* Closed Orders */}
              {currentClosedOrders.length > 0 && (
                <View style={styles.totalPnlRow}>
                  <Text style={styles.closedDateLabel}>Closed Orders</Text>
                  <Text style={styles.closedPnlValue}>
                    {currentClosedOrders
                      .reduce((sum, ord) => sum + parseFloat(ord.pnl), 0)
                      .toFixed(2)}{' '}
                    USD
                  </Text>
                </View>
              )}

              {currentClosedOrders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedClosedOrder(order)}
                  style={styles.closedCard}
                >
                  <View style={styles.closedLeftRow}>
                    <View style={styles.symbolIconWrapper}>
                      <SymbolIcon symbol={order.symbol} size={34} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.closedSymbol}>{order.symbol}</Text>
                      <Text style={styles.closedOrderTypeLot}>
                        <Text style={styles.buyText}>{order.type} {order.lot} lot</Text> at {order.openPrice}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.closedRightCol}>
                    <Text style={styles.closedPnlText}>{order.pnl} USD</Text>
                    <Text style={styles.closedPriceText}>{order.closePrice}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <View style={styles.closedRangeContainer}>
                <Text style={styles.closedRangeText}>
                  Showing closed orders for the last 30 days
                </Text>
              </View>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Close Position Confirmation Bottom Sheet Modal */}
      <ClosePositionModal
        visible={closingOrder !== null}
        order={closingOrder}
        onConfirm={async () => {
          if (closingOrder) {
            const ticket = Number(closingOrder.id);
            if (Number.isFinite(ticket) && ticket > 0) {
              try {
                await closePosition(ticket, closingOrder.lot, closingOrder.symbol);
              } catch (e) {
                console.warn('Failed to close position via MT5:', e);
              }
            }
            setOpenOrders((prev) => prev.filter((o) => o.id !== closingOrder.id));
            setClosingOrder(null);
          }
        }}
        onCancel={() => setClosingOrder(null)}
      />

      {/* Modify Order Bottom Sheet Modal */}
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

      {/* Closed Order Details Bottom Sheet Modal */}
      <ClosedOrderDetailsModal
        visible={selectedClosedOrder !== null}
        order={selectedClosedOrder}
        onDismiss={() => setSelectedClosedOrder(null)}
      />

      {/* Three Dots Floating Popover Menu */}
      <ThreeDotsDropdown
        visible={showThreeDotsMenu}
        topOffset={insets.top + 48}
        onClose={() => setShowThreeDotsMenu(false)}
        onSwitchAccount={() => setShowSwitchAccount(true)}
        onOpenAccount={() => setShowOpenAccount(true)}
      />

      {/* Switch Account Modal */}
      <SwitchAccountModal
        visible={showSwitchAccount}
        accounts={accounts}
        activeAccountId={activeAccount.id}
        onSelectAccount={(account) => {
          setActiveAccount(account);
          setShowSwitchAccount(false);
        }}
        onOpenNewAccount={() => setShowOpenAccount(true)}
        onClose={() => setShowSwitchAccount(false)}
      />

      {/* Open Account Modal */}
      <OpenAccountModal
        visible={showOpenAccount}
        onClose={() => setShowOpenAccount(false)}
        onAccountCreated={(newAccount) => {
          addAccount(newAccount);
        }}
      />

      {/* Verify Contact Details Modal (1:1 with media_1790360630579.jpg, media_1790360792277.jpg, media_1790360864782.jpg, media_1790360961087.jpg) */}
      <VerifyContactDetailsModal
        visible={showVerifyContactModal}
        onClose={() => setShowVerifyContactModal(false)}
      />

      {/* Chart Screen Full-Screen Modal */}
      {showChartModal && (
        <Modal
          visible={true}
          animationType="slide"
          onRequestClose={() => setShowChartModal(false)}
        >
          <ChartScreen
            symbol={selectedChartSymbol}
            onClose={() => setShowChartModal(false)}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.8,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
    marginLeft: 6,
  },
  dotsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  bannerContainer: {
    backgroundColor: '#FFFDF0', // Exact light ivory/yellow hue
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 16,
    marginBottom: 16,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 22,
    flex: 1,
  },
  bannerBtnRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  learnMoreBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  learnMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  completeBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFD200', // Exness yellow
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  completeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountNumberText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  gearBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 12,
  },
  chipPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  demoChipPill: {
    backgroundColor: '#E6F7EC',
  },
  demoChipText: {
    color: '#0A8754',
    fontWeight: '600',
  },
  realChipPill: {
    backgroundColor: '#FFF8E1',
  },
  realChipText: {
    color: '#B45309',
    fontWeight: '600',
  },
  chipText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  balanceText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.6,
    marginVertical: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  actionCol: {
    alignItems: 'center',
  },
  tradeYellowCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFD200',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  circleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 12.5,
    color: '#1F2937',
    fontWeight: '500',
  },
  stickyTabsWrapper: {
    backgroundColor: '#FFFFFF',
    paddingTop: 18,
    marginTop: 8,
    zIndex: 10,
  },
  stickyTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tabButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    paddingVertical: 8,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#111827',
  },
  tabButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBadge: {
    backgroundColor: '#6B7280',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  tabButtonText: {
    fontSize: 15,
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  tabTextInactive: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  totalPnlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  totalPnlLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  totalPnlValue: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '600',
  },
  closedDateLabel: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  closedPnlValue: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '600',
  },
  closedCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closedLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: {
    color: '#2563EB',
    fontWeight: '500',
  },
  closedSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  closedOrderTypeLot: {
    fontSize: 13,
    color: '#6B7280',
  },
  closedRightCol: {
    alignItems: 'flex-end',
  },
  closedPnlText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 2,
  },
  closedPriceText: {
    fontSize: 13,
    color: '#6B7280',
  },
  closedRangeContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedRangeText: {
    fontSize: 13,
    color: '#8E95A2',
    textAlign: 'center',
    lineHeight: 20,
  },
  sortButton: {
    padding: 6,
  },
  tabsUnderline: {
    height: 1,
    backgroundColor: '#F3F4F6',
    width: '100%',
  },
  ordersContent: {
    paddingTop: 16,
  },
  noOrdersText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 14,
  },
  horizontalInstrumentsList: {
    paddingHorizontal: 16,
  },
  instrumentCard: {
    width: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  instrumentSymbol: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  instrumentIconRow: {
    marginVertical: 4,
    height: 28,
    justifyContent: 'center',
  },
  doubleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instrumentPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginVertical: 4,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pendingLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cancelPendingBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  cancelPendingText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyPendingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});
