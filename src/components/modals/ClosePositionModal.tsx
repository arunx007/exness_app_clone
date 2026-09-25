import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PositionOrder } from '../cards/OrderCard';

interface ClosePositionModalProps {
  visible: boolean;
  order: PositionOrder | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ClosePositionModal: React.FC<ClosePositionModalProps> = ({
  visible,
  order,
  onConfirm,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();

  if (!order) return null;

  const isLoss = !order.isProfit;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                styles.bottomSheet,
                { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24 },
              ]}
            >
              {/* Subtle drag bar handle */}
              <View style={styles.handleBar} />

              {/* Title with Order Ticket Number */}
              <Text style={styles.title}>
                Close position #{order.id.replace('ord-btc-', '773067')} ?
              </Text>

              {/* Position details list */}
              <View style={styles.detailsContainer}>
                {/* Lots */}
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Lots</Text>
                  <Text style={styles.value}>{order.lot}</Text>
                </View>

                {/* Closing price */}
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Closing price</Text>
                  <Text style={styles.value}>{order.currentPrice}</Text>
                </View>

                {/* Profit / Loss */}
                <View style={[styles.detailRow, { marginBottom: 0 }]}>
                  <Text style={styles.label}>{isLoss ? 'Loss' : 'Profit'}</Text>
                  <Text
                    style={[
                      styles.value,
                      { color: isLoss ? '#EF4444' : '#10B981', fontWeight: '600' },
                    ]}
                  >
                    {order.pnl} USD
                  </Text>
                </View>
              </View>

              {/* Confirm Button (Yellow) */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onConfirm}
                style={styles.confirmButton}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>

              {/* Cancel Button (Light gray) */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onCancel}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Dimmed backdrop
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 28,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  label: {
    fontSize: 15,
    color: '#8E95A2',
    fontWeight: '400',
  },
  value: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  confirmButton: {
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD200', // Signature vibrant Exness Yellow
    marginBottom: 12,
  },
  confirmButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
});
