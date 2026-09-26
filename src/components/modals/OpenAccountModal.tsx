import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AccountItem } from './SwitchAccountModal';

interface OpenAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onAccountCreated: (account: AccountItem) => void;
}

interface AccountPlanOption {
  id: string;
  name: string;
  badge?: string;
  description: string;
  minDeposit: string;
  spread: string;
  commission: string;
  leverage: string;
}

const ACCOUNT_PLANS: AccountPlanOption[] = [
  {
    id: 'Standard',
    name: 'Standard',
    badge: 'Popular',
    description: 'A feature-rich, commission-free account suitable for all traders.',
    minDeposit: '$10',
    spread: 'From 0.3 pips',
    commission: 'No commission',
    leverage: 'Up to 1:Unlimited',
  },
  {
    id: 'Pro',
    name: 'Pro',
    badge: 'Zero commission',
    description: 'Instant execution account with zero commission and ultra-low spreads.',
    minDeposit: '$200',
    spread: 'From 0.1 pips',
    commission: 'No commission',
    leverage: 'Up to 1:Unlimited',
  },
  {
    id: 'Raw Spread',
    name: 'Raw Spread',
    badge: 'Lowest spreads',
    description: 'Ultra-tight raw spreads with low fixed commission per lot.',
    minDeposit: '$200',
    spread: 'From 0.0 pips',
    commission: 'Up to $3.50/lot',
    leverage: 'Up to 1:Unlimited',
  },
  {
    id: 'Zero',
    name: 'Zero',
    badge: '0 spread on 30 pairs',
    description: 'Get zero spreads on top 30 financial instruments with market execution.',
    minDeposit: '$200',
    spread: '0.0 pips',
    commission: 'From $0.20/lot',
    leverage: 'Up to 1:Unlimited',
  },
];

const LEVERAGE_OPTIONS = [
  '1:2',
  '1:20',
  '1:50',
  '1:100',
  '1:200',
  '1:400',
  '1:500',
  '1:600',
  '1:800',
  '1:1000',
  '1:2000',
  '1:Unlimited',
];

export const OpenAccountModal: React.FC<OpenAccountModalProps> = ({
  visible,
  onClose,
  onAccountCreated,
}) => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accountType, setAccountType] = useState<'Real' | 'Demo'>('Real');
  const [selectedPlan, setSelectedPlan] = useState<string>('Pro');
  const [currency, setCurrency] = useState<string>('USD');
  const [executionType, setExecutionType] = useState<string>('Market');
  const [leverage, setLeverage] = useState<string>('1:2000');
  const [nickname, setNickname] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Sub-sheets
  const [showLeverageSheet, setShowLeverageSheet] = useState<boolean>(false);
  const [showNicknameSheet, setShowNicknameSheet] = useState<boolean>(false);
  const [tempNickname, setTempNickname] = useState<string>('');

  // Password validation rules
  const isLengthValid = password.length >= 8 && password.length <= 15;
  const isCaseValid = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const isNumberValid = /[0-9]/.test(password);
  const isSpecialValid = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = isLengthValid && isCaseValid && isNumberValid && isSpecialValid;

  const resetState = () => {
    setStep(1);
    setAccountType('Real');
    setSelectedPlan('Pro');
    setCurrency('USD');
    setExecutionType('Market');
    setLeverage('1:2000');
    setNickname('');
    setPassword('');
    setShowPassword(false);
  };

  const handleModalClose = () => {
    resetState();
    onClose();
  };

  const handleFinishCreation = () => {
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const newNumber = (accountType === 'Demo' ? '150' : '140') + randomSuffix.toString().slice(0, 8);

    const newAccount: AccountItem = {
      id: `acc-${Date.now()}`,
      accountNumber: newNumber,
      type: accountType,
      server: 'Broker Bros',
      plan: selectedPlan,
      balance: accountType === 'Demo' ? '10,000.00' : '0.00',
      currency: currency,
    };

    onAccountCreated(newAccount);
    handleModalClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={step === 1}
      onRequestClose={() => {
        if (step === 3) setStep(2);
        else if (step === 2) setStep(1);
        else handleModalClose();
      }}
    >
      {/* STEP 1: Account Type Selection */}
      {step === 1 && (
        <View style={styles.overlay}>
          <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Open new account</Text>
              <TouchableOpacity onPress={handleModalClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Real vs Demo Segmented Tabs */}
            <View style={styles.tabsWrapper}>
              <TouchableOpacity
                style={[styles.tabBtn, accountType === 'Real' && styles.tabBtnActive]}
                activeOpacity={0.8}
                onPress={() => setAccountType('Real')}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    accountType === 'Real' ? styles.tabBtnTextActive : styles.tabBtnTextInactive,
                  ]}
                >
                  Real
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, accountType === 'Demo' && styles.tabBtnActive]}
                activeOpacity={0.8}
                onPress={() => setAccountType('Demo')}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    accountType === 'Demo' ? styles.tabBtnTextActive : styles.tabBtnTextInactive,
                  ]}
                >
                  Demo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Account Plans ScrollView */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            >
              {ACCOUNT_PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;

                return (
                  <TouchableOpacity
                    key={plan.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPlan(plan.id)}
                    style={[styles.planCard, isSelected && styles.planCardSelected]}
                  >
                    <View style={styles.planHeaderRow}>
                      <View style={styles.planTitleContainer}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        {plan.badge && (
                          <View style={styles.badgePill}>
                            <Text style={styles.badgeText}>{plan.badge}</Text>
                          </View>
                        )}
                      </View>

                      <View style={isSelected ? styles.radioSelected : styles.radioUnselected}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </View>

                    <Text style={styles.planDescription}>{plan.description}</Text>

                    {/* Features Grid */}
                    <View style={styles.featuresGrid}>
                      <View style={styles.featureItem}>
                        <Text style={styles.featureLabel}>Spread</Text>
                        <Text style={styles.featureValue}>{plan.spread}</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Text style={styles.featureLabel}>Commission</Text>
                        <Text style={styles.featureValue}>{plan.commission}</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Text style={styles.featureLabel}>Min deposit</Text>
                        <Text style={styles.featureValue}>{plan.minDeposit}</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Text style={styles.featureLabel}>Leverage</Text>
                        <Text style={styles.featureValue}>{plan.leverage}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Continue Button */}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.createButton}
                activeOpacity={0.85}
                onPress={() => setStep(2)}
              >
                <Text style={styles.createButtonText}>
                  Continue {accountType} {selectedPlan} account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* STEP 2: Set up your account (1:1 with media_1790357891854.jpg) */}
      {step === 2 && (
        <View style={[styles.fullScreenContainer, { paddingTop: insets.top }]}>
          {/* Header with back button */}
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity
              onPress={() => setStep(1)}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.fullScreenHeaderTitle}>Set up your account</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.fullScreenScroll}
          >
            {/* Real vs Demo Segmented Control */}
            <View style={styles.step2TabsContainer}>
              <View style={styles.step2TabsWrapper}>
                <TouchableOpacity
                  style={[
                    styles.step2TabBtn,
                    accountType === 'Real' && styles.step2TabBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setAccountType('Real')}
                >
                  <Text
                    style={[
                      styles.step2TabBtnText,
                      accountType === 'Real'
                        ? styles.step2TabBtnTextActive
                        : styles.step2TabBtnTextInactive,
                    ]}
                  >
                    Real
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.step2TabBtn,
                    accountType === 'Demo' && styles.step2TabBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setAccountType('Demo')}
                >
                  <Text
                    style={[
                      styles.step2TabBtnText,
                      accountType === 'Demo'
                        ? styles.step2TabBtnTextActive
                        : styles.step2TabBtnTextInactive,
                    ]}
                  >
                    Demo
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.step2Subtitle}>
                {accountType === 'Real'
                  ? 'Trade with real money. Withdraw anytime.'
                  : 'Practice trading with virtual funds.'}
              </Text>
            </View>

            {/* Settings Options List */}
            <View style={styles.settingsList}>
              {/* Row 1: Type */}
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Type</Text>
                <View style={styles.typePillsRow}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{selectedPlan}</Text>
                  </View>
                  <View style={[styles.typeBadge, { marginLeft: 6 }]}>
                    <Text style={styles.typeBadgeText}>MT5</Text>
                  </View>
                </View>
              </View>

              {/* Row 2: Currency */}
              <TouchableOpacity
                style={styles.settingRow}
                activeOpacity={0.7}
                onPress={() => {}}
              >
                <Text style={styles.settingLabel}>Currency</Text>
                <View style={styles.settingValueRow}>
                  <Text style={styles.settingValueText}>{currency}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#111827" />
                </View>
              </TouchableOpacity>

              {/* Row 3: Execution type */}
              <TouchableOpacity
                style={styles.settingRow}
                activeOpacity={0.7}
                onPress={() => {}}
              >
                <Text style={styles.settingLabel}>Execution type</Text>
                <View style={styles.settingValueRow}>
                  <Text style={styles.settingValueText}>{executionType}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#111827" />
                </View>
              </TouchableOpacity>

              {/* Row 4: Max leverage */}
              <TouchableOpacity
                style={styles.settingRow}
                activeOpacity={0.7}
                onPress={() => setShowLeverageSheet(true)}
              >
                <Text style={styles.settingLabel}>Max leverage</Text>
                <View style={styles.settingValueRow}>
                  <Text style={styles.settingValueText}>{leverage}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#111827" />
                </View>
              </TouchableOpacity>

              {/* Row 5: Nickname */}
              <TouchableOpacity
                style={styles.settingRow}
                activeOpacity={0.7}
                onPress={() => {
                  setTempNickname(nickname);
                  setShowNicknameSheet(true);
                }}
              >
                <View>
                  <Text style={styles.settingLabel}>Nickname</Text>
                  <Text style={styles.settingSubLabel}>
                    {nickname ? nickname : 'Optional'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#111827" />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Continue Button */}
          <View style={[styles.bottomBarFullScreen, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={styles.createButton}
              activeOpacity={0.85}
              onPress={() => setStep(3)}
            >
              <Text style={styles.createButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 3: Trading password (1:1 with media_1790357893960.jpg) */}
      {step === 3 && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.fullScreenContainer, { paddingTop: insets.top }]}>
              {/* Header with back button */}
              <View style={styles.fullScreenHeader}>
                <TouchableOpacity
                  onPress={() => setStep(2)}
                  style={styles.backBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.fullScreenHeaderTitle}>Trading password</Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.fullScreenScroll}
                keyboardShouldPersistTaps="handled"
              >
                {/* Description */}
                <Text style={styles.passwordDescription}>
                  Trading password is a password you use to log in to MetaTrader.
                </Text>

                {/* Password Input Label */}
                <Text style={styles.passwordInputLabel}>Trading password</Text>

                {/* Password Input Box */}
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordTextInput}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    placeholder=""
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={22}
                      color="#4B5563"
                    />
                  </TouchableOpacity>
                </View>

                {/* Validation Rules */}
                <View style={styles.validationList}>
                  {/* Rule 1 */}
                  <View style={styles.validationRow}>
                    <View
                      style={[
                        styles.ruleCircle,
                        isLengthValid && styles.ruleCircleValid,
                      ]}
                    >
                      {isLengthValid && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                    </View>
                    <Text
                      style={[
                        styles.ruleText,
                        isLengthValid && styles.ruleTextValid,
                      ]}
                    >
                      Between 8-15 characters
                    </Text>
                  </View>

                  {/* Rule 2 */}
                  <View style={styles.validationRow}>
                    <View
                      style={[
                        styles.ruleCircle,
                        isCaseValid && styles.ruleCircleValid,
                      ]}
                    >
                      {isCaseValid && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                    </View>
                    <Text
                      style={[
                        styles.ruleText,
                        isCaseValid && styles.ruleTextValid,
                      ]}
                    >
                      At least one upper and one lower case letter
                    </Text>
                  </View>

                  {/* Rule 3 */}
                  <View style={styles.validationRow}>
                    <View
                      style={[
                        styles.ruleCircle,
                        isNumberValid && styles.ruleCircleValid,
                      ]}
                    >
                      {isNumberValid && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                    </View>
                    <Text
                      style={[
                        styles.ruleText,
                        isNumberValid && styles.ruleTextValid,
                      ]}
                    >
                      At least one number
                    </Text>
                  </View>

                  {/* Rule 4 */}
                  <View style={styles.validationRow}>
                    <View
                      style={[
                        styles.ruleCircle,
                        isSpecialValid && styles.ruleCircleValid,
                      ]}
                    >
                      {isSpecialValid && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                    </View>
                    <Text
                      style={[
                        styles.ruleText,
                        isSpecialValid && styles.ruleTextValid,
                      ]}
                    >
                      At least one special character
                    </Text>
                  </View>
                </View>

                {/* Security Note */}
                <Text style={styles.securityNote}>
                  Save this password now. For your security, it won’t be sent to your email.
                </Text>
              </ScrollView>

              {/* Create Account Button */}
              <View style={[styles.bottomBarFullScreen, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <TouchableOpacity
                  style={[
                    styles.createButton,
                    !isPasswordValid && { opacity: 0.5 },
                  ]}
                  activeOpacity={0.85}
                  disabled={!isPasswordValid}
                  onPress={handleFinishCreation}
                >
                  <Text style={styles.createButtonText}>Create account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}

      {/* Leverage Selector Sheet */}
      <Modal
        visible={showLeverageSheet}
        animationType="fade"
        transparent
        onRequestClose={() => setShowLeverageSheet(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowLeverageSheet(false)}>
          <View style={styles.subModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.subModalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <View style={styles.subModalHeader}>
                  <Text style={styles.subModalTitle}>Max leverage</Text>
                  <TouchableOpacity
                    onPress={() => setShowLeverageSheet(false)}
                    style={styles.closeBtn}
                  >
                    <Ionicons name="close" size={20} color="#111827" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 350 }}>
                  {LEVERAGE_OPTIONS.map((item) => {
                    const isSelected = leverage === item;
                    return (
                      <TouchableOpacity
                        key={item}
                        style={styles.pickerRow}
                        activeOpacity={0.7}
                        onPress={() => {
                          setLeverage(item);
                          setShowLeverageSheet(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerText,
                            isSelected && styles.pickerTextSelected,
                          ]}
                        >
                          {item}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark" size={20} color="#111827" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Nickname Input Sheet */}
      <Modal
        visible={showNicknameSheet}
        animationType="fade"
        transparent
        onRequestClose={() => setShowNicknameSheet(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowNicknameSheet(false)}>
          <View style={styles.subModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.subModalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <View style={styles.subModalHeader}>
                  <Text style={styles.subModalTitle}>Account nickname</Text>
                  <TouchableOpacity
                    onPress={() => setShowNicknameSheet(false)}
                    style={styles.closeBtn}
                  >
                    <Ionicons name="close" size={20} color="#111827" />
                  </TouchableOpacity>
                </View>

                <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                  <TextInput
                    style={styles.nicknameInput}
                    value={tempNickname}
                    onChangeText={setTempNickname}
                    placeholder="Enter nickname (optional)"
                    placeholderTextColor="#9CA3AF"
                    autoFocus
                  />

                  <TouchableOpacity
                    style={[styles.createButton, { marginTop: 16 }]}
                    activeOpacity={0.85}
                    onPress={() => {
                      setNickname(tempNickname.trim());
                      setShowNicknameSheet(false);
                    }}
                  >
                    <Text style={styles.createButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsWrapper: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#111827',
  },
  tabBtnTextInactive: {
    color: '#6B7280',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  planCardSelected: {
    borderColor: '#111827',
    backgroundColor: '#FAFAFA',
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  badgePill: {
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#854D0E',
  },
  radioSelected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#111827',
  },
  radioUnselected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  planDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  featureItem: {
    width: '50%',
    marginBottom: 6,
  },
  featureLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  featureValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 1,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  createButton: {
    backgroundColor: '#FFD200',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  /* STEP 2 & 3 FULL SCREEN STYLES */
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
    marginRight: 10,
  },
  fullScreenHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  fullScreenScroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },

  /* Step 2 Styles */
  step2TabsContainer: {
    marginBottom: 20,
  },
  step2TabsWrapper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 3,
    backgroundColor: '#FFFFFF',
  },
  step2TabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  step2TabBtnActive: {
    backgroundColor: '#F4F4F6',
  },
  step2TabBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  step2TabBtnTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  step2TabBtnTextInactive: {
    color: '#4B5563',
  },
  step2Subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  settingsList: {
    marginTop: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingSubLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  settingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginRight: 6,
  },
  typePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: '#F4F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  bottomBarFullScreen: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
  },

  /* Step 3 Styles */
  passwordDescription: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    marginBottom: 24,
  },
  passwordInputLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    height: 52,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  passwordTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#111827',
  },
  eyeBtn: {
    padding: 6,
  },
  validationList: {
    marginBottom: 24,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ruleCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  ruleCircleValid: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  ruleText: {
    fontSize: 13.5,
    color: '#6B7280',
  },
  ruleTextValid: {
    color: '#111827',
  },
  securityNote: {
    fontSize: 13.5,
    color: '#374151',
    lineHeight: 20,
  },

  /* Sub Modals */
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  subModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  subModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  pickerText: {
    fontSize: 15,
    color: '#374151',
  },
  pickerTextSelected: {
    fontWeight: '700',
    color: '#111827',
  },
  nicknameInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
});
