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
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface NicknameScreenProps {
  currentNickname: string;
  onBack: () => void;
  onSave: (newNickname: string) => void;
}

export const NicknameScreen: React.FC<NicknameScreenProps> = ({
  currentNickname,
  onBack,
  onSave,
}) => {
  const insets = useSafeAreaInsets();
  const [nickname, setNickname] = useState(currentNickname);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nickname</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
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
          >
            <View style={styles.topSection}>
              {/* Input Box */}
              <View style={styles.inputBox}>
                <TextInput
                  value={nickname}
                  onChangeText={setNickname}
                  maxLength={36}
                  autoFocus={true}
                  style={styles.textInput}
                />
              </View>

              {/* Subtitle Warning and Character Count */}
              <View style={styles.counterRow}>
                <Text style={styles.warningText}>
                  Nicknames can't contain special characters:{'\n'}&lt;&gt;"&?^*#@
                </Text>
                <Text style={styles.counterText}>{nickname.length}/36</Text>
              </View>
            </View>

            {/* Bottom Save Changes Button */}
            <View style={styles.bottomSection}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onSave(nickname)}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save changes</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  topSection: {
    width: '100%',
  },
  inputBox: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    fontSize: 16,
    color: '#111827',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#8E95A2',
    lineHeight: 18,
    flex: 1,
  },
  counterText: {
    fontSize: 13,
    color: '#8E95A2',
    marginLeft: 8,
  },
  bottomSection: {
    width: '100%',
    paddingTop: 24,
  },
  saveButton: {
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD200', // Signature vibrant Exness Yellow
  },
  saveButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
});
