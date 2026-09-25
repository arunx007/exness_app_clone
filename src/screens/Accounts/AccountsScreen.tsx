import React, { useState, useEffect } from 'react';
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

  const [openOrders, setOpenOrders] = useState<PositionOrder[]>([
    {
      id: 'ord-btc-1',
      symbol: 'BTC',
      type: 'Buy',
      lot: 0.01,
      openPrice: '97054.72',
      currentPrice: '97726.11',
      pnl: '-2.29',
      isProfit: false,
    },
  ]);
  const [closedOrders, setClosedOrders] = useState<ClosedOrder[]>([
    {
      id: 'cls-7730675',
      symbol: 'BTC',
      type: 'Buy',
      lot: 0.01,
      openPrice: '83954.32',
      closePrice: '83833.43',
      openTime: '25 Sept 2026 22:45:25',
      closeTime: '25 Sept 2026 22:55:38',
      closedBy: 'User',
      swap: '0.00 USD',
      commission: '0.00 USD',
      stopLoss: '—',
      takeProfit: '—',
      pnl: '-1.21',
      isProfit: false,
    },
  ]);

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
              {activeAccount.balance} {activeAccount.currency}
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
                  {openOrders.length > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{openOrders.length}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('Pending')}
                style={[styles.tabButton, activeTab === 'Pending' && styles.tabButtonActive]}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === 'Pending' ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                >
                  Pending
                </Text>
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
          {activeTab === 'Open' && openOrders.length > 0 ? (
            <View>
              {/* Total P/L Row */}
              <View style={styles.totalPnlRow}>
                <Text style={styles.totalPnlLabel}>Total P/L</Text>
                <Text
                  style={[
                    styles.totalPnlValue,
                    {
                      color:
                        openOrders.reduce((sum, ord) => sum + parseFloat(ord.pnl), 0) >= 0
                          ? '#10B981'
                          : '#EF4444',
                    },
                  ]}
                >
                  {openOrders
                    .reduce((sum, ord) => sum + parseFloat(ord.pnl), 0)
                    .toFixed(2)}{' '}
                  USD
                </Text>
              </View>

              {/* Order Cards */}
              {openOrders.map((order) => (
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
          ) : activeTab === 'Closed' ? (
            <View>
              {/* Today, 25 September Header & Day P/L */}
              <View style={styles.totalPnlRow}>
                <Text style={styles.closedDateLabel}>Today, 25 September</Text>
                <Text style={styles.closedPnlValue}>-1.21 USD</Text>
              </View>

              {/* Closed Order Cards */}
              {closedOrders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedClosedOrder(order)}
                  style={styles.closedCard}
                >
                  <View style={styles.closedLeftRow}>
                    <View style={styles.cryptoIcon}>
                      <Ionicons name="logo-bitcoin" size={20} color="#FFFFFF" />
                    </View>
                    <View>
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

              {/* Date Range Info Footer */}
              <View style={styles.closedRangeContainer}>
                <Text style={styles.closedRangeText}>
                  Showing closed orders for the last 30 days:{'\n'}27/08/2026 - 25/09/2026
                </Text>
              </View>
            </View>
          ) : (
            <View>
              {/* Subtitle */}
              <Text style={styles.noOrdersText}>
                No open orders. Find your next trade:
              </Text>

              {/* Horizontal Instrument Cards */}
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
                    {/* Symbol name */}
                    <Text style={styles.instrumentSymbol}>{item.symbol}</Text>

                    {/* Instrument Icon representation */}
                    <View style={styles.instrumentIconRow}>
                      {item.symbol === 'XAU/USD' && (
                        <View style={styles.doubleBadgeRow}>
                          <View style={[styles.miniCircle, { backgroundColor: '#F59E0B' }]}>
                            <Ionicons name="cube" size={14} color="#FFFFFF" />
                          </View>
                          <View style={[styles.miniCircle, { backgroundColor: '#3B82F6', marginLeft: -6 }]}>
                            <Ionicons name="flag" size={12} color="#FFFFFF" />
                          </View>
                        </View>
                      )}
                      {item.symbol === 'BTC' && (
                        <View style={[styles.miniCircle, { backgroundColor: '#F7931A' }]}>
                          <Ionicons name="logo-bitcoin" size={16} color="#FFFFFF" />
                        </View>
                      )}
                      {item.symbol === 'USOIL' && (
                        <View style={[styles.miniCircle, { backgroundColor: '#111827' }]}>
                          <Ionicons name="water" size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </View>

                    {/* Price */}
                    <Text style={styles.instrumentPrice}>{item.price}</Text>

                    {/* Percentage change pill */}
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
          )}
        </View>
      </ScrollView>

      {/* Close Position Confirmation Bottom Sheet Modal */}
      <ClosePositionModal
        visible={closingOrder !== null}
        order={closingOrder}
        onConfirm={() => {
          if (closingOrder) {
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
        onSelectAccount={(account) => setActiveAccount(account)}
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
  cryptoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F7931A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
});
