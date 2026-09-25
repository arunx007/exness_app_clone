import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mt5AuthService } from '../../api';
import { AccountItem } from './SwitchAccountModal';

interface Mt5PasswordLoginModalProps {
  visible: boolean;
  account: AccountItem | null;
  onSuccess: () => void;
  onClose: () => void;
}

export const Mt5PasswordLoginModal: React.FC<Mt5PasswordLoginModalProps> = ({
  visible,
  account,
  onSuccess,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!account) return null;

  const handleLogin = async () => {
    if (!password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const login = Number(account.accountNumber);
      if (!Number.isFinite(login) || login <= 0) {
        throw new Error(`Invalid MT5 login: ${account.accountNumber}`);
      }

      await mt5AuthService.login({
        login,
        password: password.trim(),
        passwordType: 'Main',
      });

      setPassword('');
      onSuccess();
    } catch (err: any) {
      Alert.alert(
        'Switch MT5 Account',
        err?.message || 'Could not log in to this MT5 account. Please check your password.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>MT5 Account Login</Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.accountTitle}>#{account.accountNumber}</Text>
            <Text style={styles.accountSubtitle}>
              Enter the MT5 trading password for this {account.type.toLowerCase()} account to connect and switch.
            </Text>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="MT5 Trading Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                style={styles.input}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={!password.trim() || isSubmitting}
              activeOpacity={0.85}
              style={[
                styles.submitBtn,
                (!password.trim() || isSubmitting) && styles.submitBtnDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <Text style={styles.submitBtnText}>Log In & Switch</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingVertical: 20,
  },
  accountTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  accountSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F9FAFB',
    height: 52,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  eyeBtn: {
    padding: 6,
  },
  submitBtn: {
    backgroundColor: '#FFDE00',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
});
