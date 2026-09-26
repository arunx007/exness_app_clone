import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Switch,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface NewOrderPayload {
  symbol: string;
  orderType: 'Buy' | 'Sell';
  executionType: 'Market' | 'Limit' | 'Stop';
  price: number;
  lot: number;
  stopLoss?: number;
  takeProfit?: number;
  margin: number;
}

interface OrderExecutionModalProps {
  visible: boolean;
  orderType: 'Buy' | 'Sell';
  symbol: string;
  currentMarketPrice: number;
  initialLots?: number;
  initialTab?: 'Market' | 'Pending';
  leverage?: number;
  onClose: () => void;
  onConfirmOrder: (payload: NewOrderPayload) => void;
  onPendingPriceChange?: (price: number, pendingType: 'Buy Stop' | 'Buy Limit' | 'Sell Stop' | 'Sell Limit') => void;
  onTabChange?: (tab: 'Market' | 'Pending') => void;
  onLotsChange?: (lots: number) => void;
}

export const OrderExecutionModal: React.FC<OrderExecutionModalProps> = ({
  visible,
  orderType,
  symbol,
  currentMarketPrice,
  initialLots = 0.01,
  initialTab = 'Market',
  leverage = 400,
  onClose,
  onConfirmOrder,
  onPendingPriceChange,
  onTabChange,
  onLotsChange,
}) => {
  const insets = useSafeAreaInsets();
  const isBuy = orderType === 'Buy';

  // Tabs: 'Market' | 'Pending'
  const [activeTab, setActiveTab] = useState<'Market' | 'Pending'>(initialTab);

  // Risk-based switch
  const [isRiskBased, setIsRiskBased] = useState(false);

  // Lots state
  const [lots, setLots] = useState(initialLots);

  // Pending price state
  const [pendingPrice, setPendingPrice] = useState(
    isBuy ? currentMarketPrice + 160 : currentMarketPrice - 160
  );

  // SL / TP expansion
  const [showSlTp, setShowSlTp] = useState(false);
  const [slValue, setSlValue] = useState<string>('');
  const [tpValue, setTpValue] = useState<string>('');

  // Slider percentage preset (0%, 25%, 50%, 75%, 100%)
  const [sliderPct, setSliderPct] = useState(25);

  // Sync initial lots when modal becomes visible
  useEffect(() => {
    if (visible) {
      setLots(initialLots || 0.01);
      const defaultPending = isBuy
        ? parseFloat((currentMarketPrice + 160.0).toFixed(2))
        : parseFloat((currentMarketPrice - 160.0).toFixed(2));
      setPendingPrice(defaultPending);
    }
  }, [visible]);

  // Determine Pending Order Type (Stop vs Limit)
  const isAboveMarket = pendingPrice > currentMarketPrice;
  let pendingSubtype: 'Limit' | 'Stop' = 'Limit';
  let fullPendingType: 'Buy Stop' | 'Buy Limit' | 'Sell Stop' | 'Sell Limit' = 'Buy Limit';

  if (isBuy) {
    if (isAboveMarket) {
      pendingSubtype = 'Stop';
      fullPendingType = 'Buy Stop';
    } else {
      pendingSubtype = 'Limit';
      fullPendingType = 'Buy Limit';
    }
  } else {
    if (isAboveMarket) {
      pendingSubtype = 'Limit';
      fullPendingType = 'Sell Limit';
    } else {
      pendingSubtype = 'Stop';
      fullPendingType = 'Sell Stop';
    }
  }

  // Pips from market calculation
  const pipDiff = ((pendingPrice - currentMarketPrice) * 10).toFixed(1);
  const pipDiffText =
    pendingPrice >= currentMarketPrice
      ? `+${pipDiff} pips from market`
      : `${pipDiff} pips from market`;

  // Financial calculations
  const execPrice = activeTab === 'Market' ? currentMarketPrice : pendingPrice;
  const marginUsd = ((lots * execPrice) / leverage).toFixed(2);
  const feesUsd = (lots * 10.0).toFixed(2);

  const handleSelectTab = (tab: 'Market' | 'Pending') => {
    setActiveTab(tab);
    onTabChange?.(tab);
    if (tab === 'Pending' && onPendingPriceChange) {
      onPendingPriceChange(pendingPrice, fullPendingType);
    }
  };

  const adjustLots = (delta: number) => {
    setLots((prev) => {
      const next = Math.max(0.01, parseFloat((prev + delta).toFixed(2)));
      onLotsChange?.(next);
      return next;
    });
  };

  const adjustPendingPrice = (delta: number) => {
    setPendingPrice((prev) => {
      const next = Math.max(0.01, parseFloat((prev + delta).toFixed(2)));
      if (onPendingPriceChange) {
        const isAbv = next > currentMarketPrice;
        const pType = isBuy
          ? (isAbv ? 'Buy Stop' : 'Buy Limit')
          : (isAbv ? 'Sell Limit' : 'Sell Stop');
        onPendingPriceChange(next, pType);
      }
      return next;
    });
  };

  const handleSliderSelect = (pct: number) => {
    setSliderPct(pct);
    // Approximate volume based on percentage (scale 0.01 up to 5.0 lots)
    const calculated = parseFloat((0.01 + (pct / 100) * 4.75).toFixed(2));
    setLots(calculated);
    onLotsChange?.(calculated);
  };

  const handleConfirm = () => {
    onConfirmOrder({
      symbol,
      orderType,
      executionType: activeTab === 'Market' ? 'Market' : pendingSubtype,
      price: execPrice,
      lot: lots,
      stopLoss: slValue ? parseFloat(slValue) : undefined,
      takeProfit: tpValue ? parseFloat(tpValue) : undefined,
      margin: parseFloat(marginUsd),
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.sheetContainer} pointerEvents="box-none">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.bottomSheet,
            { paddingBottom: Math.max(insets.bottom, 14) + 6 },
          ]}
        >
          {/* Drag Handle (tap to close) */}
          <TouchableOpacity
            style={styles.handleContainer}
            activeOpacity={0.7}
            onPress={onClose}
          >
            <View style={styles.handleBar} />
          </TouchableOpacity>

                {/* Tabs: Market | Pending */}
                <View style={styles.tabsHeader}>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === 'Market' && styles.tabButtonActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectTab('Market')}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === 'Market' && styles.tabTextActive,
                      ]}
                    >
                      Market
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === 'Pending' && styles.tabButtonActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectTab('Pending')}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === 'Pending' && styles.tabTextActive,
                      ]}
                    >
                      Pending
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.contentBody}>
                  {/* PENDING TAB SPECIFIC: Price Stepper */}
                  {activeTab === 'Pending' && (
                    <View style={styles.sectionBlock}>
                      <View style={styles.labelRow}>
                        <Text style={styles.sectionLabel}>
                          Price · {pendingSubtype}
                        </Text>
                        <View style={styles.riskSwitchRow}>
                          <Text style={styles.riskLabel}>Risk-based</Text>
                          <Ionicons
                            name="information-circle-outline"
                            size={14}
                            color="#9CA3AF"
                            style={{ marginHorizontal: 4 }}
                          />
                          <Switch
                            value={isRiskBased}
                            onValueChange={setIsRiskBased}
                            trackColor={{ false: '#E5E7EB', true: '#64748B' }}
                            thumbColor="#FFFFFF"
                            style={styles.switchSmall}
                          />
                        </View>
                      </View>

                      {/* Stepper for Pending Price */}
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => adjustPendingPrice(-10.0)}
                          activeOpacity={0.6}
                        >
                          <Ionicons name="remove" size={18} color="#374151" />
                        </TouchableOpacity>

                        <Text style={styles.stepperValue}>
                          {pendingPrice.toFixed(2)}
                        </Text>

                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => adjustPendingPrice(10.0)}
                          activeOpacity={0.6}
                        >
                          <Ionicons name="add" size={18} color="#374151" />
                        </TouchableOpacity>
                      </View>

                      {/* Helper Pips Text */}
                      <Text style={styles.pipsHelperText}>{pipDiffText}</Text>
                    </View>
                  )}

                  {/* VOLUME ROW */}
                  <View style={styles.sectionBlock}>
                    <View style={styles.labelRow}>
                      <Text style={styles.sectionLabel}>
                        {activeTab === 'Market' ? 'Volume, lots' : 'Volume'}
                      </Text>
                      {activeTab === 'Market' && (
                        <View style={styles.riskSwitchRow}>
                          <Text style={styles.riskLabel}>Risk-based</Text>
                          <Ionicons
                            name="information-circle-outline"
                            size={14}
                            color="#9CA3AF"
                            style={{ marginHorizontal: 4 }}
                          />
                          <Switch
                            value={isRiskBased}
                            onValueChange={setIsRiskBased}
                            trackColor={{ false: '#E5E7EB', true: '#64748B' }}
                            thumbColor="#FFFFFF"
                            style={styles.switchSmall}
                          />
                        </View>
                      )}
                    </View>

                    {/* Stepper for Volume */}
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustLots(-0.01)}
                        activeOpacity={0.6}
                      >
                        <Ionicons name="remove" size={18} color="#374151" />
                      </TouchableOpacity>

                      <Text style={styles.stepperValue}>{lots.toFixed(2)}</Text>

                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustLots(0.01)}
                        activeOpacity={0.6}
                      >
                        <Ionicons name="add" size={18} color="#374151" />
                      </TouchableOpacity>
                    </View>

                    {/* Interactive Slider Bar */}
                    <View style={styles.sliderTrackContainer}>
                      <View style={styles.sliderTrackBackground} />
                      <View
                        style={[
                          styles.sliderTrackFill,
                          { width: `${sliderPct}%` },
                        ]}
                      />
                      {[0, 25, 50, 75, 100].map((pct) => (
                        <TouchableOpacity
                          key={pct}
                          style={[styles.sliderTick, { left: `${pct}%` }]}
                          onPress={() => handleSliderSelect(pct)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.sliderTickDot,
                              sliderPct >= pct && styles.sliderTickDotActive,
                            ]}
                          />
                        </TouchableOpacity>
                      ))}
                      <View
                        style={[
                          styles.sliderThumb,
                          { left: `${Math.min(95, Math.max(2, sliderPct))}%` },
                        ]}
                      />
                    </View>
                  </View>

                  {/* MARGIN & SL/TP TOGGLE ROW */}
                  <View style={styles.marginRow}>
                    <Text style={styles.marginText}>
                      Margin: {marginUsd} USD
                    </Text>

                    <TouchableOpacity
                      style={styles.sltpDropdownBtn}
                      activeOpacity={0.8}
                      onPress={() => setShowSlTp(!showSlTp)}
                    >
                      <Text style={styles.sltpDropdownText}>SL / TP</Text>
                      <Ionicons
                        name={showSlTp ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color="#374151"
                        style={{ marginLeft: 4 }}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* OPTIONAL EXPANDABLE SL/TP INPUT DRAWER */}
                  {showSlTp && (
                    <View style={styles.sltpExpandable}>
                      <View style={styles.sltpInputRow}>
                        <View style={styles.sltpInputCol}>
                          <Text style={styles.sltpInputLabel}>Take Profit</Text>
                          <TextInput
                            style={styles.sltpInputField}
                            placeholder="Price"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={tpValue}
                            onChangeText={setTpValue}
                          />
                        </View>
                        <View style={styles.sltpInputCol}>
                          <Text style={styles.sltpInputLabel}>Stop Loss</Text>
                          <TextInput
                            style={styles.sltpInputField}
                            placeholder="Price"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={slValue}
                            onChangeText={setSlValue}
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {/* ACTION BUTTONS (Cancel & Confirm) */}
                  <View style={styles.actionButtonsRow}>
                    {/* Cancel Button */}
                    <TouchableOpacity
                      style={styles.cancelButton}
                      activeOpacity={0.8}
                      onPress={onClose}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    {/* Confirm Button */}
                    <TouchableOpacity
                      style={[
                        styles.confirmButton,
                        isBuy ? styles.confirmBuyBg : styles.confirmSellBg,
                      ]}
                      activeOpacity={0.85}
                      onPress={handleConfirm}
                    >
                      {activeTab === 'Pending' && (
                        <View style={styles.pendingBadge}>
                          <Text
                            style={[
                              styles.pendingBadgeText,
                              { color: isBuy ? '#1E88E5' : '#EF4444' },
                            ]}
                          >
                            {pendingSubtype}
                          </Text>
                        </View>
                      )}
                      <View style={styles.confirmTextCol}>
                        <Text style={styles.confirmTitle}>
                          Confirm {isBuy ? 'Buy' : 'Sell'} {lots.toFixed(2)} lots
                        </Text>
                        <Text style={styles.confirmPrice}>
                          {execPrice.toFixed(2)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* FOOTER ROW (Fees & Leverage) */}
                  <View style={styles.footerRow}>
                    <Text style={styles.footerText}>
                      Fees: ~ {feesUsd} USD · Leverage: 1:{leverage}
                    </Text>
                    <TouchableOpacity activeOpacity={0.7}>
                      <Ionicons
                        name="information-circle-outline"
                        size={17}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    width: '100%',
    zIndex: 999,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#F3F4F6',
  },
  handleContainer: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 4,
  },
  tabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#111827',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  contentBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  riskSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  switchSmall: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  stepBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.2,
  },
  pipsHelperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginLeft: 2,
  },
  sliderTrackContainer: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
    marginTop: 8,
  },
  sliderTrackBackground: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    width: '100%',
  },
  sliderTrackFill: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#94A3B8',
    borderRadius: 2,
  },
  sliderTick: {
    position: 'absolute',
    top: 11,
    width: 10,
    height: 10,
    marginLeft: -5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTickDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
  },
  sliderTickDotActive: {
    backgroundColor: '#475569',
  },
  sliderThumb: {
    position: 'absolute',
    top: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    marginLeft: -11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  marginRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  marginText: {
    fontSize: 14.5,
    color: '#374151',
    fontWeight: '500',
  },
  sltpDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  sltpDropdownText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#374151',
  },
  sltpExpandable: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sltpInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sltpInputCol: {
    flex: 1,
  },
  sltpInputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 4,
  },
  sltpInputField: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#111827',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  cancelButton: {
    width: 100,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  confirmButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  confirmBuyBg: {
    backgroundColor: '#1E88E5',
  },
  confirmSellBg: {
    backgroundColor: '#EF4444',
  },
  pendingBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    marginRight: 10,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  confirmTextCol: {
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  confirmPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
