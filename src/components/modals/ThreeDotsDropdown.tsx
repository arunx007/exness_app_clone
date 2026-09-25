import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface ThreeDotsDropdownProps {
  visible: boolean;
  onClose: () => void;
  onSwitchAccount: () => void;
  onOpenAccount: () => void;
  topOffset: number;
}

export const SwitchAccountIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 20,
  color = '#111827',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 16h11a3 3 0 0 0 3-3v-1M20 8H9a3 3 0 0 0-3 3v1"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17 5l3 3-3 3M7 19l-3-3 3-3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PlusIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 22,
  color = '#111827',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14M5 12h14"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ThreeDotsDropdown: React.FC<ThreeDotsDropdownProps> = ({
  visible,
  onClose,
  onSwitchAccount,
  onOpenAccount,
  topOffset,
}) => {
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.menuCard, { top: topOffset }]}>
              {/* Option 1: Switch account */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.65}
                onPress={() => {
                  onClose();
                  onSwitchAccount();
                }}
              >
                <View style={styles.iconContainer}>
                  <SwitchAccountIcon size={20} color="#111827" />
                </View>
                <Text style={styles.menuItemText}>Switch account</Text>
              </TouchableOpacity>

              {/* Option 2: Open account */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.65}
                onPress={() => {
                  onClose();
                  onOpenAccount();
                }}
              >
                <View style={styles.iconContainer}>
                  <PlusIcon size={22} color="#111827" />
                </View>
                <Text style={styles.menuItemText}>Open account</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuCard: {
    position: 'absolute',
    right: 16,
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 0.5,
    borderColor: '#F3F4F6',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  iconContainer: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
});
