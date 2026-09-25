import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';

export type VerificationStep =
  | 'OVERVIEW'
  | 'CONFIRM_EMAIL'
  | 'OVERVIEW_VERIFIED'
  | 'ENTER_PHONE';

interface VerifyContactDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  email?: string;
  initialStep?: VerificationStep;
  onComplete?: () => void;
}

const getCountryFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return '🇺🇸';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const VerifyContactDetailsModal: React.FC<VerifyContactDetailsModalProps> = ({
  visible,
  onClose,
  email = 't****1@gmail.com',
  initialStep = 'OVERVIEW',
  onComplete,
}) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState<VerificationStep>(initialStep);

  // Email OTP state
  const [otpCode, setOtpCode] = useState<string>('');
  const [timerSeconds, setTimerSeconds] = useState<number>(57);
  const otpInputRef = useRef<TextInput>(null);

  // Phone input state - Default USA (+1, 🇺🇸)
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>('US');
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>('+1');
  const [phoneCountryFlag, setPhoneCountryFlag] = useState<string>('🇺🇸');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [showCountryPicker, setShowCountryPicker] = useState<boolean>(false);

  const handleSelectCountry = (country: Country) => {
    setSelectedCountryCode(country.cca2);
    if (country.callingCode && country.callingCode.length > 0) {
      setPhoneCountryCode(`+${country.callingCode[0]}`);
    }
    // Convert 2-letter country code (cca2) to guaranteed flag emoji
    setPhoneCountryFlag(getCountryFlagEmoji(country.cca2));
    setShowCountryPicker(false);
  };

  // Reset or initialize on open or initialStep change
  useEffect(() => {
    if (visible) {
      setCurrentStep(initialStep);
      setOtpCode('');
      setTimerSeconds(57);
      setPhoneNumber('');
      setSelectedCountryCode('US');
      setPhoneCountryCode('+1');
      setPhoneCountryFlag('🇺🇸');
      setShowCountryPicker(false);
    }
  }, [visible, initialStep]);

  // Countdown timer for Email OTP
  useEffect(() => {
    if (currentStep === 'CONFIRM_EMAIL' && timerSeconds > 0) {
      const interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStep, timerSeconds]);

  // Handle OTP digit changes: auto-advance when 6 digits are entered
  const handleOtpChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtpCode(cleaned);
    if (cleaned.length === 6) {
      // Simulate verification delay
      setTimeout(() => {
        setCurrentStep('OVERVIEW_VERIFIED');
      }, 400);
    }
  };

  if (!visible) return null;

  const formatTimer = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // -------------------------------------------------------------
  // RENDER: STEP 1 - Confirm Email Screen (media_1790360792277.jpg)
  // -------------------------------------------------------------
  const renderConfirmEmail = () => {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => setCurrentStep('OVERVIEW')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={26} color="#111827" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.emailContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Title & Subtitle */}
          <Text style={styles.title}>Confirm your email</Text>
          <Text style={styles.subtitle}>We've sent you email with verification code</Text>

          {/* Email Info Capsule Row */}
          <View style={styles.emailCapsuleRow}>
            <View style={styles.atIconCircle}>
              <Ionicons name="at" size={20} color="#111827" />
            </View>
            <View style={styles.emailCapsuleTextCol}>
              <Text style={styles.emailSentToLabel}>Enter the code we sent to:</Text>
              <Text style={styles.emailAddressValue}>{email}</Text>
            </View>
          </View>

          {/* Hidden text input for keyboard capture */}
          <TextInput
            ref={otpInputRef}
            value={otpCode}
            onChangeText={handleOtpChange}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.hiddenOtpInput}
            autoFocus
          />

          {/* 6 OTP Code Display Boxes */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => otpInputRef.current?.focus()}
            style={styles.otpBoxesRow}
          >
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const char = otpCode[index] || '';
              const isFocused = otpCode.length === index;
              return (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    isFocused && styles.otpBoxFocused,
                    char !== '' && styles.otpBoxFilled,
                  ]}
                >
                  {char !== '' ? (
                    <Text style={styles.otpCharText}>{char}</Text>
                  ) : isFocused ? (
                    <View style={styles.cursorBar} />
                  ) : null}
                </View>
              );
            })}
          </TouchableOpacity>

          {/* Timer text */}
          <Text style={styles.resendTimerText}>
            Get a new code in {formatTimer(timerSeconds)}
          </Text>

          {/* "I didn't receive a code" Link */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.didNotReceiveLink}
            onPress={() => alert(`Verification code re-sent to ${email}`)}
          >
            <Text style={styles.didNotReceiveText}>I didn't receive a code</Text>
          </TouchableOpacity>

          {/* Quick helper button to simulate instant code entry */}
          <TouchableOpacity
            style={styles.demoFillBtn}
            onPress={() => handleOtpChange('849201')}
          >
            <Text style={styles.demoFillText}>Auto-fill Code (849201)</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // -------------------------------------------------------------
  // RENDER: Dynamic Country Picker Screen (Searchable A-Z with flags & dial codes)
  // -------------------------------------------------------------
  const renderCountryPickerScreen = () => {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Top Header */}
        <View style={styles.countryPickerHeader}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowCountryPicker(false)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.countryPickerHeaderTitle}>Select country</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowCountryPicker(false)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <CountryPicker
            countryCode={selectedCountryCode}
            preferredCountries={['US', 'GB', 'IN', 'AE', 'CA', 'AU']}
            withFilter
            withFlag
            withCallingCode
            withAlphaFilter
            withEmoji
            withCloseButton={false}
            withModal={false}
            onSelect={handleSelectCountry}
            onClose={() => setShowCountryPicker(false)}
            filterProps={{
              placeholder: 'Search country or dialing code...',
            }}
            flatListProps={{
              showsVerticalScrollIndicator: false,
            } as any}
          />
        </View>
      </View>
    );
  };

  // -------------------------------------------------------------
  // RENDER: STEP 3 - Enter Phone Number (media_1790360961087.jpg)
  // -------------------------------------------------------------
  const renderEnterPhone = () => {
    if (showCountryPicker) {
      return renderCountryPickerScreen();
    }

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          {/* TOP BAR */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => setCurrentStep('OVERVIEW_VERIFIED')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={26} color="#111827" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.phoneContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title & Subtitle */}
            <Text style={styles.title}>Enter your phone number</Text>
            <Text style={styles.subtitle}>We'll send a verification code to this number</Text>

            {/* Blue Info Notice Card (1:1 with media_1790360961087.jpg) */}
            <View style={styles.infoNoticeCard}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="information-circle-outline" size={24} color="#2563EB" />
              </View>
              <Text style={styles.infoNoticeText}>
                Please use a phone number from the country of your current residence. You will be asked to verify your address later
              </Text>
            </View>

            {/* Phone Number Input Label & Container */}
            <Text style={styles.phoneLabel}>Phone number</Text>
            <View style={styles.phoneInputContainer}>
              {/* Flag + Country Code Picker (Dynamic) */}
              <TouchableOpacity
                style={styles.countryPickerRow}
                activeOpacity={0.7}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={styles.flagEmoji}>{phoneCountryFlag}</Text>
                <Text style={styles.countryCodeText}>{phoneCountryCode}</Text>
                <Ionicons name="chevron-down" size={14} color="#6B7280" style={{ marginLeft: 4 }} />
              </TouchableOpacity>

              {/* Vertical divider */}
              <View style={styles.phoneInputDivider} />

              {/* Phone text input */}
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder=""
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                style={styles.phoneTextInput}
                autoFocus
              />
            </View>
            {/* Continue Button (Placed directly below input with 6px radius like reference) */}
            <TouchableOpacity
              style={[
                styles.phoneContinueBtn,
                phoneNumber.trim().length === 0 && { opacity: 0.8 },
              ]}
              activeOpacity={0.88}
              onPress={() => {
                alert(`Verification code sent to ${phoneCountryCode} ${phoneNumber}`);
                if (onComplete) onComplete();
                onClose();
              }}
            >
              <Text style={styles.phoneContinueText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  };

  // -------------------------------------------------------------------------------------------------
  // RENDER: OVERVIEW SCREEN (Initial with "Get started now" OR Verified with Green Checkmark & "Confirm phone")
  // (media_1790360630579.jpg & media_1790360864782.jpg)
  // -------------------------------------------------------------------------------------------------
  const renderOverview = () => {
    const isEmailVerified = currentStep === 'OVERVIEW_VERIFIED';

    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={26} color="#111827" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {/* Main Title & Subtitle */}
          <Text style={styles.title}>Verify your contact details</Text>
          <Text style={styles.subtitle}>This process takes less than 5 minutes</Text>

          {/* Steps List */}
          <View style={styles.stepsList}>
            {/* Step 1: Confirm Email */}
            <View style={styles.stepItem}>
              <View style={styles.stepIconContainer}>
                <Ionicons name="mail-outline" size={26} color="#475569" />
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>1. Confirm email address</Text>
                <Text style={styles.stepSubtitle}>{email}</Text>
              </View>

              {/* Green Verified Checkmark (media_1790360864782.jpg) */}
              {isEmailVerified && (
                <View style={styles.greenCheckBadge}>
                  <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                </View>
              )}
            </View>

            <View style={styles.stepDivider} />

            {/* Step 2: Confirm Phone */}
            <View style={styles.stepItem}>
              <View style={styles.stepIconContainer}>
                <Ionicons name="chatbox-ellipses-outline" size={26} color="#475569" />
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>2. Confirm phone number</Text>
                <Text style={styles.stepSubtitle}>Make your account more secure</Text>
              </View>
            </View>

            <View style={styles.stepDivider} />

            {/* Step 3: Profile Info */}
            <View style={styles.stepItem}>
              <View style={styles.stepIconContainer}>
                <Ionicons name="clipboard-outline" size={26} color="#475569" />
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>3. Add profile information</Text>
                <Text style={styles.stepSubtitle}>Get a more tailored experience</Text>
              </View>
            </View>
          </View>
        </View>

        {/* BOTTOM SECTION */}
        <View style={styles.bottomSection}>
          {/* Action Button: "Get started now" (Initial) OR "Confirm phone" (Verified) */}
          <TouchableOpacity
            style={styles.getStartedBtn}
            activeOpacity={0.88}
            onPress={() => {
              if (isEmailVerified) {
                setCurrentStep('ENTER_PHONE');
              } else {
                setCurrentStep('CONFIRM_EMAIL');
              }
            }}
          >
            <Text style={styles.getStartedText}>
              {isEmailVerified ? 'Confirm phone' : 'Get started now'}
            </Text>
          </TouchableOpacity>

          {/* Light Grey "Do it later" Button */}
          <TouchableOpacity
            style={styles.doItLaterBtn}
            activeOpacity={0.8}
            onPress={onClose}
          >
            <Text style={styles.doItLaterText}>Do it later</Text>
          </TouchableOpacity>

          {/* Security Encrypted Footer */}
          <View style={styles.securityRow}>
            <Ionicons name="lock-closed-outline" size={14} color="#4B5563" style={{ marginRight: 6 }} />
            <Text style={styles.securityText}>All data is encrypted for security</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      {currentStep === 'CONFIRM_EMAIL' && renderConfirmEmail()}
      {currentStep === 'ENTER_PHONE' && renderEnterPhone()}
      {(currentStep === 'OVERVIEW' || currentStep === 'OVERVIEW_VERIFIED') && renderOverview()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  iconBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 27,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15.5,
    color: '#6B7280',
    marginBottom: 28,
    fontWeight: '400',
  },
  stepsList: {
    marginTop: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  stepIconContainer: {
    width: 38,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16.5,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  stepDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
    marginLeft: 38,
  },
  greenCheckBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  getStartedBtn: {
    backgroundColor: '#FFDE02',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  getStartedText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  doItLaterBtn: {
    backgroundColor: '#F3F4F6',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  doItLaterText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  securityText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '400',
  },

  // Email Screen Styles
  emailContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  emailCapsuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  atIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emailCapsuleTextCol: {
    justifyContent: 'center',
  },
  emailSentToLabel: {
    fontSize: 14.5,
    color: '#111827',
    fontWeight: '500',
  },
  emailAddressValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
    marginTop: 2,
  },
  hiddenOtpInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFocused: {
    borderColor: '#111827',
    borderWidth: 1.5,
  },
  otpBoxFilled: {
    borderColor: '#D1D5DB',
  },
  otpCharText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
  },
  cursorBar: {
    width: 2,
    height: 24,
    backgroundColor: '#111827',
    borderRadius: 1,
  },
  resendTimerText: {
    fontSize: 14.5,
    color: '#4B5563',
    marginBottom: 16,
  },
  didNotReceiveLink: {
    alignSelf: 'flex-start',
    marginBottom: 28,
  },
  didNotReceiveText: {
    fontSize: 14.5,
    color: '#2563EB',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  demoFillBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  demoFillText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },

  // Phone Screen Styles
  phoneContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  infoNoticeCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  infoIconWrapper: {
    marginRight: 10,
    marginTop: 1,
  },
  infoNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
    fontWeight: '400',
  },
  phoneLabel: {
    fontSize: 13.5,
    color: '#4B5563',
    fontWeight: '500',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    height: 52,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  countryPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  flagEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  phoneInputDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginRight: 10,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  phoneContinueBtn: {
    backgroundColor: '#FFDE02',
    height: 48,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  phoneContinueText: {
    color: '#111827',
    fontSize: 15.5,
    fontWeight: '700',
  },
  countryPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  countryPickerHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
});
