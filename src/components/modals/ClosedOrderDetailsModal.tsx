import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export interface ClosedOrder {
  id: string;
  symbol: string;
  type: 'Buy' | 'Sell';
  lot: number;
  openPrice: string;
  closePrice: string;
  openTime: string;
  closeTime: string;
  closedBy: string;
  swap: string;
  commission: string;
  stopLoss: string;
  takeProfit: string;
  pnl: string;
  isProfit: boolean;
}

interface ClosedOrderDetailsModalProps {
  visible: boolean;
  order: ClosedOrder | null;
  onDismiss: () => void;
}

export const ClosedOrderDetailsModal: React.FC<ClosedOrderDetailsModalProps> = ({
  visible,
  order,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();

  if (!order) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onDismiss}>
          <View style={styles.backdropTouch} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.bottomSheet,
            { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24 },
          ]}
        >
          {/* Drag Handle Bar */}
          <View style={styles.handleBar} />

          {/* Ticket ID #7730675 */}
          <Text style={styles.ticketId}>
            #{order.id.replace('cls-', '773067')}
          </Text>

          {/* Order Header Summary */}
          <View style={styles.orderSummaryRow}>
            <View style={styles.orderLeft}>
              <View style={styles.cryptoIcon}>
                <Ionicons name="logo-bitcoin" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.orderSymbol}>{order.symbol}</Text>
                <Text style={styles.orderTypeLot}>
                  <Text style={styles.buyText}>{order.type} {order.lot}</Text> at {order.openPrice}
                </Text>
              </View>
            </View>

            <View style={styles.orderRight}>
              <Text
                style={[
                  styles.orderPnl,
                  { color: order.isProfit ? '#10B981' : '#EF4444' },
                ]}
              >
                {order.pnl} USD
              </Text>
              <Text style={styles.orderClosePrice}>{order.closePrice}</Text>
            </View>
          </View>

          {/* Detailed Metric Rows */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.metricsContainer}
          >
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Open Price</Text>
              <Text style={styles.metricValue}>{order.openPrice}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Close Price</Text>
              <Text style={styles.metricValue}>{order.closePrice}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Open time</Text>
              <Text style={styles.metricValue}>{order.openTime}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Close time</Text>
              <Text style={styles.metricValue}>{order.closeTime}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Closed by</Text>
              <View style={styles.closedByPill}>
                <Text style={styles.closedByText}>{order.closedBy}</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Swap</Text>
              <Text style={styles.metricValue}>{order.swap}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Commission</Text>
              <Text style={styles.metricValue}>{order.commission}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Stop Loss</Text>
              <Text style={styles.metricValue}>{order.stopLoss}</Text>
            </View>

            <View style={[styles.metricRow, { marginBottom: 0 }]}>
              <Text style={styles.metricLabel}>Take Profit</Text>
              <Text style={styles.metricValue}>{order.takeProfit}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    width: '100%',
    maxHeight: '85%',
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  ticketId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 16,
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cryptoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F7931A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  orderSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  orderTypeLot: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  buyText: {
    color: '#2563EB',
    fontWeight: '500',
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderPnl: {
    fontSize: 16,
    fontWeight: '600',
  },
  orderClosePrice: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  metricsContainer: {
    paddingVertical: 4,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  metricLabel: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '400',
  },
  metricValue: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '400',
  },
  closedByPill: {
    backgroundColor: '#64748B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  closedByText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
