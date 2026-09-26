import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SymbolIcon } from '../common/SymbolIcon';
import { PositionOrder } from '../cards/OrderCard';

interface ModifyOrderModalProps {
  visible: boolean;
  order: PositionOrder | null;
  onConfirmModify?: (payload: { ticket: number; stopLoss?: number; takeProfit?: number }) => Promise<void> | void;
  onPartialClose?: (payload: { ticket: number; volume: number; symbol: string }) => Promise<void> | void;
  onCloseOrder?: () => void;
  onDismiss: () => void;
}

export const ModifyOrderModal: React.FC<ModifyOrderModalProps> = ({
  visible,
  order,
  onConfirmModify,
  onPartialClose,
  onCloseOrder,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const [activeSubTab, setActiveSubTab] = useState<'Modify' | 'Partial close' | 'Close by'>('Modify');

  // Modify Tab State
  const [stopLossEnabled, setStopLossEnabled] = useState(false);
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(false);
  const [stopLossPrice, setStopLossPrice] = useState('83904.64');
  const [takeProfitPrice, setTakeProfitPrice] = useState('83920.13');

  // Partial Close Tab State
  const [closingVolume, setClosingVolume] = useState('0.02');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) return null;

  const handleConfirmModify = async () => {
    if (!order) return;
    const ticket = parseInt(order.id.replace('ord-btc-', '').replace('ord-', ''), 10) || 7730671;
    const sl = stopLossEnabled && stopLossPrice ? parseFloat(stopLossPrice) : undefined;
    const tp = takeProfitEnabled && takeProfitPrice ? parseFloat(takeProfitPrice) : undefined;
    setIsSubmitting(true);
    try {
      await onConfirmModify?.({ ticket, stopLoss: sl, takeProfit: tp });
      onDismiss();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePartialClose = async () => {
    if (!order) return;
    const ticket = parseInt(order.id.replace('ord-btc-', '').replace('ord-', ''), 10) || 7730671;
    const vol = parseFloat(closingVolume);
    if (!vol || vol <= 0) return;
    setIsSubmitting(true);
    try {
      await onPartialClose?.({ ticket, volume: vol, symbol: order.symbol });
      onDismiss();
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustStopLoss = (amount: number) => {
    const val = (parseFloat(stopLossPrice || '0') + amount).toFixed(2);
    setStopLossPrice(val);
  };

  const adjustTakeProfit = (amount: number) => {
    const val = (parseFloat(takeProfitPrice || '0') + amount).toFixed(2);
    setTakeProfitPrice(val);
  };

  const adjustVolume = (amount: number) => {
    const val = Math.max(0.01, parseFloat(closingVolume || '0') + amount).toFixed(2);
    setClosingVolume(val);
  };

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

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View
            style={[
              styles.bottomSheet,
              { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16 },
            ]}
          >
            {/* Drag Handle Bar */}
            <View style={styles.handleBar} />

            {/* Ticket ID #7730671 */}
            <Text style={styles.ticketId}>
              #{order.id.replace('ord-btc-', '773067')}
            </Text>

            {/* Order Summary Row */}
            <View style={styles.orderSummaryRow}>
              <View style={styles.orderLeft}>
                <View style={styles.symbolIconWrapper}>
                  <SymbolIcon symbol={order.symbol} size={36} />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.orderSymbol}>{order.symbol}</Text>
                  <Text style={styles.orderTypeLot}>
                    <Text style={styles.buyText}>{order.type} {order.lot} lot</Text> at {order.openPrice}
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
                <Text style={styles.orderCurrentPrice}>{order.currentPrice}</Text>
              </View>
            </View>

            {/* Sub Tab Switcher: Modify | Partial close | Close by */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                onPress={() => setActiveSubTab('Modify')}
                style={[
                  styles.tabItem,
                  activeSubTab === 'Modify' && styles.tabItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeSubTab === 'Modify' ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                >
                  Modify
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveSubTab('Partial close')}
                style={[
                  styles.tabItem,
                  activeSubTab === 'Partial close' && styles.tabItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeSubTab === 'Partial close' ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                >
                  Partial close
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveSubTab('Close by')}
                style={[
                  styles.tabItem,
                  activeSubTab === 'Close by' && styles.tabItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeSubTab === 'Close by' ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                >
                  Close by
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Content inside Bottom Sheet */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              contentContainerStyle={{ paddingVertical: 12 }}
            >
              {activeSubTab === 'Modify' && (
                /* ================= TAB 1: MODIFY ================= */
                <View>
                  {/* Time & Swap Info Row */}
                  <View style={styles.timeSwapRow}>
                    <View>
                      <Text style={styles.infoLabel}>Time:</Text>
                      <Text style={styles.infoValue}>25/09/2026, 22:45:25</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.infoLabel}>Swap:</Text>
                      <Text style={styles.infoValue}>0.00 USD</Text>
                    </View>
                  </View>

                  {/* STOP LOSS TOGGLE & INPUT */}
                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleTitle}>Stop Loss</Text>
                    <Switch
                      value={stopLossEnabled}
                      onValueChange={setStopLossEnabled}
                      trackColor={{ false: '#E5E7EB', true: '#4B5563' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  {stopLossEnabled && (
                    <View style={styles.inputContainer}>
                      <View style={styles.stepperInputRow}>
                        <TouchableOpacity
                          onPress={() => adjustStopLoss(-1)}
                          style={styles.stepperBtn}
                        >
                          <Ionicons name="remove" size={18} color="#111827" />
                        </TouchableOpacity>

                        <TextInput
                          value={stopLossPrice}
                          onChangeText={setStopLossPrice}
                          keyboardType="decimal-pad"
                          style={styles.numericInput}
                        />

                        <TouchableOpacity
                          onPress={() => adjustStopLoss(1)}
                          style={styles.stepperBtn}
                        >
                          <Ionicons name="add" size={18} color="#111827" />
                        </TouchableOpacity>

                        {/* Dropdown pill (Price v) */}
                        <View style={styles.unitPill}>
                          <Text style={styles.unitText}>Price</Text>
                          <Ionicons name="chevron-down" size={16} color="#4B5563" />
                        </View>
                      </View>
                      <Text style={styles.calcSubText}>
                        -0.99 USD | -0.01 % | -496.8 pips
                      </Text>
                    </View>
                  )}

                  {/* TAKE PROFIT TOGGLE & INPUT */}
                  <View style={[styles.toggleRow, { marginTop: stopLossEnabled ? 16 : 8 }]}>
                    <Text style={styles.toggleTitle}>Take Profit</Text>
                    <Switch
                      value={takeProfitEnabled}
                      onValueChange={setTakeProfitEnabled}
                      trackColor={{ false: '#E5E7EB', true: '#4B5563' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  {takeProfitEnabled && (
                    <View style={styles.inputContainer}>
                      <View style={styles.stepperInputRow}>
                        <TouchableOpacity
                          onPress={() => adjustTakeProfit(-1)}
                          style={styles.stepperBtn}
                        >
                          <Ionicons name="remove" size={18} color="#111827" />
                        </TouchableOpacity>

                        <TextInput
                          value={takeProfitPrice}
                          onChangeText={setTakeProfitPrice}
                          keyboardType="decimal-pad"
                          style={styles.numericInput}
                        />

                        <TouchableOpacity
                          onPress={() => adjustTakeProfit(1)}
                          style={styles.stepperBtn}
                        >
                          <Ionicons name="add" size={18} color="#111827" />
                        </TouchableOpacity>

                        {/* Dropdown pill (Price v) */}
                        <View style={styles.unitPill}>
                          <Text style={styles.unitText}>Price</Text>
                          <Ionicons name="chevron-down" size={16} color="#4B5563" />
                        </View>
                      </View>
                      <Text style={styles.calcSubText}>
                        -0.68 USD | -0.01 % | -341.9 pips
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {activeSubTab === 'Partial close' && (
                /* ================= TAB 2: PARTIAL CLOSE ================= */
                <View>
                  <Text style={styles.closingVolumeLabel}>Closing Volume (Lots)</Text>

                  {/* Lots Stepper */}
                  <View style={styles.volumeStepperRow}>
                    <TouchableOpacity
                      onPress={() => adjustVolume(-0.01)}
                      style={styles.volumeBtn}
                    >
                      <Ionicons name="remove" size={20} color="#111827" />
                    </TouchableOpacity>

                    <TextInput
                      value={closingVolume}
                      onChangeText={setClosingVolume}
                      keyboardType="decimal-pad"
                      style={styles.volumeInput}
                    />

                    <TouchableOpacity
                      onPress={() => adjustVolume(0.01)}
                      style={styles.volumeBtn}
                    >
                      <Ionicons name="add" size={20} color="#111827" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.volumeRangeText}>0.01 - 0.02 lots</Text>

                  <View style={styles.estimatedLossRow}>
                    <Text style={styles.estimatedLabel}>Estimated Loss:</Text>
                    <Text style={styles.estimatedValue}>-0.55 USD</Text>
                  </View>
                </View>
              )}

              {activeSubTab === 'Close by' && (
                /* ================= TAB 3: CLOSE BY ================= */
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#8E95A2' }}>No opposing positions to close by.</Text>
                </View>
              )}
            </ScrollView>

            {/* FIXED BOTTOM ACTION BUTTONS: ALWAYS PINNED AND 100% VISIBLE */}
            <View style={styles.fixedBottomActions}>
              {activeSubTab === 'Modify' ? (
                stopLossEnabled || takeProfitEnabled ? (
                  <View style={styles.actionBtnRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={onDismiss}
                      style={styles.cancelBtn}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={onDismiss}
                      style={styles.confirmYellowBtn}
                    >
                      <Ionicons name="checkmark" size={18} color="#111827" style={{ marginRight: 4 }} />
                      <Text style={styles.confirmYellowText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.actionBtnRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.chartBtn}
                    >
                      <Text style={styles.chartBtnText}>View on chart</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        onDismiss();
                        onCloseOrder?.();
                      }}
                      style={styles.closeOrderBtn}
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#111827" style={{ marginRight: 6 }} />
                      <Text style={styles.closeOrderText}>Close order</Text>
                    </TouchableOpacity>
                  </View>
                )
              ) : activeSubTab === 'Partial close' ? (
                <View style={styles.actionBtnRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.chartBtn}
                  >
                    <Text style={styles.chartBtnText}>View on chart</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      onDismiss();
                      onCloseOrder?.();
                    }}
                    style={styles.closeOrderBtn}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#111827" style={{ marginRight: 6 }} />
                    <Text style={styles.closeOrderText}>Close {closingVolume} L...</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '88%',
    width: '100%',
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
    marginBottom: 16,
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
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
  orderCurrentPrice: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabItem: {
    paddingVertical: 10,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#111827',
  },
  tabText: {
    fontSize: 14.5,
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  tabTextInactive: {
    color: '#8E95A2',
    fontWeight: '400',
  },
  timeSwapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  infoLabel: {
    fontSize: 13,
    color: '#8E95A2',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  inputContainer: {
    marginTop: 8,
  },
  stepperInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  stepperBtn: {
    width: 44,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numericInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  unitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: '100%',
  },
  unitText: {
    fontSize: 14,
    color: '#111827',
    marginRight: 4,
  },
  calcSubText: {
    fontSize: 12,
    color: '#8E95A2',
    marginTop: 6,
    paddingLeft: 4,
  },
  fixedBottomActions: {
    width: '100%',
    paddingTop: 12,
  },
  actionBtnRow: {
    flexDirection: 'row',
    width: '100%',
  },
  chartBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  chartBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  closeOrderBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  closeOrderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  confirmYellowBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFD200',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  confirmYellowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  closingVolumeLabel: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '400',
    marginBottom: 8,
  },
  volumeStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  volumeBtn: {
    width: 48,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  volumeRangeText: {
    fontSize: 12,
    color: '#8E95A2',
    marginTop: 6,
    paddingLeft: 4,
    marginBottom: 16,
  },
  estimatedLossRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  estimatedLabel: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '400',
  },
  estimatedValue: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
});
