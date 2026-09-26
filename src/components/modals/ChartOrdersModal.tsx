import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PositionOrder } from '../cards/OrderCard';
import { SymbolIcon } from '../common/SymbolIcon';

export interface PendingOrderItem {
  ticket: number;
  symbol: string;
  type: string;
  volume: number;
  price: string;
  openTime?: string | number;
}

export interface ClosedOrderItem {
  id: string;
  symbol: string;
  type: string;
  lot: number;
  openPrice: string;
  closePrice: string;
  pnl: string;
  isProfit?: boolean;
}

interface ChartOrdersModalProps {
  visible: boolean;
  onClose: () => void;
  orders: PositionOrder[];
  pendingOrders?: PendingOrderItem[];
  closedOrders?: ClosedOrderItem[];
  onOrderPress?: (order: PositionOrder) => void;
  onCancelPending?: (ticket: number) => void;
  initialTab?: 'Open' | 'Pending' | 'Closed';
}

export const ChartOrdersModal: React.FC<ChartOrdersModalProps> = ({
  visible,
  onClose,
  orders,
  pendingOrders = [],
  closedOrders = [],
  onOrderPress,
  onCancelPending,
  initialTab = 'Open',
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'Open' | 'Pending' | 'Closed'>(initialTab);
  const slideAnim = useRef(new Animated.Value(visible ? 0 : 400)).current;
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 400,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, initialTab]);

  if (!visible) return null;

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <View style={styles.rootOverlay}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheetContainer,
          {
            paddingBottom: Math.max(insets.bottom, 24),
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
              {/* Top Drag Indicator */}
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>

              {/* Tabs Row: Open 1 | Pending | Closed + Sort Icon */}
              <View style={styles.tabsRow}>
                <View style={styles.tabButtonsGroup}>
                  {/* Open Tab */}
                  <TouchableOpacity
                    style={[
                      styles.tabBtn,
                      activeTab === 'Open' && styles.tabBtnActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setActiveTab('Open')}
                  >
                    <View style={styles.tabInnerRow}>
                      <Text
                        style={[
                          styles.tabText,
                          activeTab === 'Open'
                            ? styles.tabTextActive
                            : styles.tabTextInactive,
                        ]}
                      >
                        Open
                      </Text>
                      {orders.length > 0 && (
                        <View style={styles.tabBadge}>
                          <Text style={styles.tabBadgeText}>{orders.length}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Pending Tab */}
                  <TouchableOpacity
                    style={[
                      styles.tabBtn,
                      activeTab === 'Pending' && styles.tabBtnActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setActiveTab('Pending')}
                  >
                    <View style={styles.tabInnerRow}>
                      <Text
                        style={[
                          styles.tabText,
                          activeTab === 'Pending'
                            ? styles.tabTextActive
                            : styles.tabTextInactive,
                        ]}
                      >
                        Pending
                      </Text>
                      {pendingOrders.length > 0 && (
                        <View style={styles.tabBadge}>
                          <Text style={styles.tabBadgeText}>{pendingOrders.length}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Closed Tab */}
                  <TouchableOpacity
                    style={[
                      styles.tabBtn,
                      activeTab === 'Closed' && styles.tabBtnActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setActiveTab('Closed')}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === 'Closed'
                          ? styles.tabTextActive
                          : styles.tabTextInactive,
                      ]}
                    >
                      Closed
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sort Button (⇅) */}
                <TouchableOpacity style={styles.sortBtn} activeOpacity={0.7}>
                  <Ionicons name="swap-vertical" size={18} color="#4B5563" />
                </TouchableOpacity>
              </View>
              <View style={styles.tabsDivider} />

              {/* Orders Content */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {activeTab === 'Open' ? (
                  orders.length > 0 ? (
                    orders.map((order) => (
                      <TouchableOpacity
                        key={order.id}
                        activeOpacity={0.75}
                        style={styles.orderCard}
                        onPress={() => onOrderPress && onOrderPress(order)}
                      >
                        {/* Left: Icon + Symbol + Type & Lot */}
                        <View style={styles.orderCardLeft}>
                          <SymbolIcon symbol={order.symbol} size={32} />
                          <View style={{ marginLeft: 10 }}>
                            <Text style={styles.symbolName}>{order.symbol}</Text>
                            <Text style={styles.orderMetaText}>
                              <Text style={styles.buyText}>
                                {order.type} {order.lot} lot
                              </Text>{' '}
                              at {order.openPrice}
                            </Text>
                          </View>
                        </View>

                        {/* Right: P/L & Current Price */}
                        <View style={styles.orderCardRight}>
                          <Text
                            style={[
                              styles.pnlText,
                              {
                                color:
                                  parseFloat(order.pnl) >= 0
                                    ? '#10B981'
                                    : '#EF4444',
                              },
                            ]}
                          >
                            {order.pnl} USD
                          </Text>
                          <Text style={styles.currentPriceText}>
                            {order.currentPrice}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No open orders</Text>
                    </View>
                  )
                ) : activeTab === 'Pending' ? (
                  pendingOrders.length > 0 ? (
                    pendingOrders.map((ord) => (
                      <View key={ord.ticket} style={styles.orderCard}>
                        <View style={styles.orderCardLeft}>
                          <SymbolIcon symbol={ord.symbol} size={32} />
                          <View style={{ marginLeft: 10 }}>
                            <Text style={styles.symbolName}>{ord.symbol}</Text>
                            <Text style={styles.orderMetaText}>
                              <Text style={styles.buyText}>
                                {ord.type.replace('_', ' ')} {ord.volume} lot
                              </Text>{' '}
                              at {ord.price}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.cancelPendingBtn}
                          activeOpacity={0.7}
                          onPress={() => onCancelPending?.(ord.ticket)}
                        >
                          <Text style={styles.cancelPendingText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No pending orders</Text>
                    </View>
                  )
                ) : (
                  closedOrders.length > 0 ? (
                    closedOrders.map((cord) => (
                      <View key={cord.id} style={styles.orderCard}>
                        <View style={styles.orderCardLeft}>
                          <SymbolIcon symbol={cord.symbol} size={32} />
                          <View style={{ marginLeft: 10 }}>
                            <Text style={styles.symbolName}>{cord.symbol}</Text>
                            <Text style={styles.orderMetaText}>
                              <Text style={styles.buyText}>
                                {cord.type} {cord.lot} lot
                              </Text>{' '}
                              at {cord.openPrice}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.orderCardRight}>
                          <Text
                            style={[
                              styles.pnlText,
                              {
                                color:
                                  cord.isProfit || parseFloat(cord.pnl) >= 0
                                    ? '#10B981'
                                    : '#EF4444',
                              },
                            ]}
                          >
                            {cord.pnl} USD
                          </Text>
                          <Text style={styles.currentPriceText}>{cord.closePrice}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No closed orders today</Text>
                    </View>
                  )
                )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 9999,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 280,
    maxHeight: '65%',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  tabButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBtn: {
    paddingVertical: 10,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#111827',
  },
  tabInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabText: {
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
  tabBadge: {
    backgroundColor: '#5C748C',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sortBtn: {
    padding: 6,
  },
  tabsDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    width: '100%',
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  orderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cryptoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7931A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cryptoIconText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  symbolName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  orderMetaText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '400',
  },
  buyText: {
    color: '#2563EB',
    fontWeight: '500',
  },
  orderCardRight: {
    alignItems: 'flex-end',
  },
  pnlText: {
    fontSize: 15.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  currentPriceText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  cancelPendingBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  cancelPendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
});
