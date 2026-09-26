import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Image,
  Switch,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface OneClickTradingModalProps {
  visible: boolean;
  onClose: () => void;
  onEnable: (dontShowAgain: boolean) => void;
}

export const OneClickTradingModal: React.FC<OneClickTradingModalProps> = ({
  visible,
  onClose,
  onEnable,
}) => {
  const insets = useSafeAreaInsets();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                styles.bottomSheet,
                { paddingBottom: Math.max(insets.bottom, 16) + 8 },
              ]}
            >
              {/* Center Grab Handle */}
              <View style={styles.handleBar} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Title */}
                <Text style={styles.title}>Trade at full speed</Text>

                {/* Hero 3D Lightning Image */}
                <View style={styles.imageContainer}>
                  <Image
                    source={require('../../assets/images/one_click_trade_lightning.jpg')}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                </View>

                {/* Feature 1 */}
                <View style={styles.featureRow}>
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons
                      name="cursor-default-click-outline"
                      size={22}
                      color="#111827"
                    />
                  </View>
                  <Text style={styles.featureText}>
                    Open and close trades without confirmation
                  </Text>
                </View>

                {/* Feature 2 */}
                <View style={styles.featureRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="checkmark-done" size={22} color="#111827" />
                  </View>
                  <Text style={styles.featureText}>
                    Close all positions or only profitable ones with one click
                  </Text>
                </View>

                {/* Feature 3 */}
                <View style={styles.featureRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="scan-outline" size={22} color="#111827" />
                  </View>
                  <Text style={styles.featureText}>
                    Focus on the market with an expanded chart
                  </Text>
                </View>

                {/* Disclaimer / Warning */}
                <Text style={styles.disclaimerText}>
                  By enabling this mode, you accept all risks of instant execution,
                  including errors, commissions, price changes, or unintended
                  trades. All orders placed in this mode are your sole
                  responsibility.
                </Text>

                {/* Don't show again toggle */}
                <View style={styles.dontShowRow}>
                  <Text style={styles.dontShowText}>Don’t show again</Text>
                  <Switch
                    value={dontShowAgain}
                    onValueChange={setDontShowAgain}
                    trackColor={{ false: '#E5E7EB', true: '#64748B' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#E5E7EB"
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    activeOpacity={0.8}
                    onPress={onClose}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.enableButton}
                    activeOpacity={0.85}
                    onPress={() => onEnable(dontShowAgain)}
                  >
                    <Text style={styles.enableButtonText}>Enable</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    maxHeight: '92%',
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  imageContainer: {
    width: '100%',
    height: 190,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#EEF2F6',
    marginBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '400',
    lineHeight: 20,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 16,
  },
  dontShowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 20,
  },
  dontShowText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  closeButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  enableButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FFD200',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
});
