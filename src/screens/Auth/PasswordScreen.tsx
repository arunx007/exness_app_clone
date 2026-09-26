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

interface PasswordScreenProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const PasswordScreen: React.FC<PasswordScreenProps> = ({
  email,
  onBack,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');

  // Validations matching screenshot:
  // 1. Between 8-15 characters
  const isLengthValid = password.length >= 8 && password.length <= 15;
  // 2. At least one upper and one lower case letter
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const isUpperLowerValid = hasUpper && hasLower;
  // 3. At least one number
  const isNumberValid = /[0-9]/.test(password);
  // 4. At least one special character
  const isSpecialValid = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  const isAllValid =
    isLengthValid && isUpperLowerValid && isNumberValid && isSpecialValid;

  const handleRegister = () => {
    Keyboard.dismiss();
    onSuccess();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header with Back Chevron and 'Choose a password' Title */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose a password</Text>
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
            {/* Top Section with Password Input & Rules */}
            <View style={styles.topSection}>
              <ExnessInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                isPassword={true}
                containerStyle={{ marginBottom: 12 }}
              />

              {/* Password Requirements Checklist */}
              <View style={styles.rulesContainer}>
                {/* Rule 1: Between 8-15 characters + character counter */}
                <View style={styles.ruleRow}>
                  <View style={styles.ruleLeft}>
                    <View
                      style={[
                        styles.ruleCircle,
                        isLengthValid && styles.ruleCircleValid,
                      ]}
                    />
                    <Text
                      style={[
                        styles.ruleText,
                        isLengthValid && styles.ruleTextValid,
                      ]}
                    >
                      Between 8-15 characters
                    </Text>
                  </View>
                  <Text style={styles.charCountText}>{password.length}</Text>
                </View>

                {/* Rule 2: At least one upper and one lower case letter */}
                <View style={styles.ruleRow}>
                  <View style={styles.ruleLeft}>
                    <View
                      style={[
                        styles.ruleCircle,
                        isUpperLowerValid && styles.ruleCircleValid,
                      ]}
                    />
                    <Text
                      style={[
                        styles.ruleText,
                        isUpperLowerValid && styles.ruleTextValid,
                      ]}
                    >
                      At least one upper and one lower case letter
                    </Text>
                  </View>
                </View>

                {/* Rule 3: At least one number */}
                <View style={styles.ruleRow}>
                  <View style={styles.ruleLeft}>
                    <View
                      style={[
                        styles.ruleCircle,
                        isNumberValid && styles.ruleCircleValid,
                      ]}
                    />
                    <Text
                      style={[
                        styles.ruleText,
                        isNumberValid && styles.ruleTextValid,
                      ]}
                    >
                      At least one number
                    </Text>
                  </View>
                </View>

                {/* Rule 4: At least one special character */}
                <View style={styles.ruleRow}>
                  <View style={styles.ruleLeft}>
                    <View
                      style={[
                        styles.ruleCircle,
                        isSpecialValid && styles.ruleCircleValid,
                      ]}
                    />
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
              </View>
            </View>

            {/* Bottom Actions and Detailed Legal Text */}
            <View style={styles.bottomSection}>
              {/* Register Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleRegister}
                style={[
                  styles.registerButton,
                  isAllValid ? styles.buttonActive : styles.buttonActive,
                ]}
              >
                <Text style={styles.registerButtonText}>Register</Text>
              </TouchableOpacity>

              {/* Legal Text 1: Regulatory disclosure */}
              <Text style={styles.regulatorText}>
                You are registering with Broker Bros Ltd, regulated by the Seychelles FSA.
              </Text>

              {/* Legal Text 2: Terms and Agreements with blue links */}
              <Text style={styles.agreementsText}>
                By clicking Register, you confirm that you have read, understood, and agree with all the information in the{' '}
                <Text style={styles.blueLink}>Client Agreement</Text> and the service terms and conditions listed in the following documents:{' '}
                <Text style={styles.blueLink}>General Business Terms</Text>,{' '}
                <Text style={styles.blueLink}>Partnership Agreement</Text>,{' '}
                <Text style={styles.blueLink}>Privacy Policy</Text>,{' '}
                <Text style={styles.blueLink}>Risk Disclosure and Warning Notice</Text>, and the{' '}
                <Text style={styles.blueLink}>Key Facts Statement</Text>.
              </Text>

              {/* Legal Text 3: CFD Risk Disclaimer */}
              <Text style={styles.cfdRiskText}>
                You also confirm that you fully understand the nature and the risks of the services and products envisaged. Trading CFDs is not suitable for everyone; it should be done by traders with a high risk tolerance and who can afford potential losses.
              </Text>
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
  rulesContainer: {
    width: '100%',
    paddingLeft: 2,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ruleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ruleCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#6B7280',
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  ruleCircleValid: {
    backgroundColor: '#00BA66',
    borderColor: '#00BA66',
  },
  ruleText: {
    fontSize: 13.5,
    color: '#4B5563',
    fontWeight: '400',
  },
  ruleTextValid: {
    color: '#111827',
  },
  charCountText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
    paddingRight: 4,
  },
  bottomSection: {
    width: '100%',
    paddingTop: 28,
  },
  registerButton: {
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD200', // Signature vibrant Exness Yellow
    marginBottom: 16,
  },
  buttonActive: {
    backgroundColor: '#FFD200',
  },
  registerButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  regulatorText: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  agreementsText: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  blueLink: {
    color: '#2563EB',
  },
  cfdRiskText: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 18,
  },
});
