import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ExnessInput } from '../../components/common/ExnessInput';

interface RegisterScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  onGoToSignIn: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [confirmedResidence, setConfirmedResidence] = useState(false);

  const isFormValid = email.trim().length > 0 && confirmedResidence;

  const handleContinue = () => {
    Keyboard.dismiss();
    onSuccess();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header with Back Chevron and 'Enter your email' Title */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enter your email</Text>
      </View>

      {/* Keyboard Responsive Scroll Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Top Form Input */}
            <View style={styles.topSection}>
              <ExnessInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Bottom Actions Section */}
            <View style={styles.bottomSection}>
              {/* Checkbox: Residence Confirmation */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setConfirmedResidence(!confirmedResidence)}
                style={styles.checkboxRow}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    confirmedResidence && styles.checkboxBoxChecked,
                  ]}
                >
                  {confirmedResidence && (
                    <Ionicons name="checkmark" size={16} color="#111827" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  I confirm my residence country is not India, and that I am not a citizen or resident of the United States for tax purposes.
                </Text>
              </TouchableOpacity>

              {/* Continue Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleContinue}
                style={[
                  styles.continueButton,
                  isFormValid ? styles.buttonActive : styles.buttonDisabled,
                ]}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>

              {/* Partner Code (Optional) */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.partnerCodeRow}
              >
                <Ionicons
                  name="people-outline"
                  size={19}
                  color="#1F2937"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.partnerCodeText}>Partner code (Optional)</Text>
              </TouchableOpacity>

              {/* Legal and Disclaimer Note */}
              <View style={styles.legalSection}>
                <Text style={styles.legalText}>
                  By proceeding, you confirm that you have read and agree to the{' '}
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>

                <Text style={styles.disclaimerText}>
                  Demo access notice: Access is provided for demonstration purposes only and does not constitute a client relationship. Full access requires completion of profile verification.
                </Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  topSection: {
    width: '100%',
  },
  bottomSection: {
    width: '100%',
    paddingTop: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxChecked: {
    backgroundColor: '#FFD200',
    borderColor: '#FFD200',
  },
  checkboxLabel: {
    flex: 1,
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  continueButton: {
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD200',
    marginBottom: 20,
  },
  buttonActive: {
    backgroundColor: '#FFD200',
  },
  buttonDisabled: {
    backgroundColor: '#FFD200', // Matches screenshot with vibrant yellow
  },
  continueButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  partnerCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 24,
  },
  partnerCodeText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '500',
  },
  legalSection: {
    width: '100%',
  },
  legalText: {
    color: '#6B7280',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 10,
  },
  linkText: {
    color: '#2563EB', // Blue link for Privacy Policy
  },
  disclaimerText: {
    color: '#6B7280',
    fontSize: 12.5,
    lineHeight: 18,
  },
});
