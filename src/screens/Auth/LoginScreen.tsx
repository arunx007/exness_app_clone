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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ExnessInput } from '../../components/common/ExnessInput';
import { useAuth } from '../../context/AuthContext';
import { toErrorMessage } from '../../api/errors';

interface LoginScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  onGoToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFormValid = email.trim().length > 0 && password.trim().length >= 6;

  const handleSignIn = async () => {
    if (!isFormValid || loading) return;
    Keyboard.dismiss();
    setLoading(true);
    setErrorMessage(null);

    try {
      await signIn(email, password);
      onSuccess();
    } catch (err: unknown) {
      setErrorMessage(toErrorMessage(err, 'Sign in failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header with Back Chevron and 'Sign In' Title */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign In</Text>
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
            {/* Top Prompt Text */}
            <View style={styles.topSection}>
              <Text style={styles.promptText}>
                Please enter your email address and{'\n'}password
              </Text>

              {/* Error Banner */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={20} color="#DC2626" style={styles.errorIcon} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Form Fields */}
              <View style={styles.formContainer}>
                <ExnessInput
                  label="Your email address"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <ExnessInput
                  label="Password"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  isPassword={true}
                />
              </View>
            </View>

            {/* Bottom Actions (Yellow Sign In button & Forgot Password) */}
            <View style={styles.bottomSection}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSignIn}
                disabled={!isFormValid || loading}
                style={[
                  styles.signInButton,
                  isFormValid && !loading ? styles.buttonActive : styles.buttonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#111827" size="small" />
                ) : (
                  <Text style={[
                    styles.signInButtonText,
                    !isFormValid && styles.signInButtonTextDisabled,
                  ]}>
                    Sign in
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.forgotButton}
              >
                <Text style={styles.forgotText}>I forgot my password</Text>
              </TouchableOpacity>
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
  promptText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '400',
    lineHeight: 24,
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 13.5,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  bottomSection: {
    width: '100%',
    paddingTop: 24,
  },
  signInButton: {
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonActive: {
    backgroundColor: '#FFD200', // Signature Exness Yellow
  },
  buttonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  signInButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  signInButtonTextDisabled: {
    color: '#9CA3AF',
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotText: {
    color: '#1F2937',
    fontSize: 14.5,
    fontWeight: '400',
  },
});
