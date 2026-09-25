import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SymbolIcon } from '../common/SymbolIcon';

export interface PositionOrder {
  id: string;
  symbol: string;
  type: 'Buy' | 'Sell';
  lot: number;
  openPrice: string;
  currentPrice: string;
  pnl: string;
  isProfit: boolean;
}

interface OrderCardProps {
  order: PositionOrder;
  onModify?: () => void;
  onClose?: () => void;
  onPress?: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onModify,
  onClose,
  onPress,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Allow swiping left up to -140px (width of two buttons: Modify & Close)
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(-140, gestureState.dx));
        } else {
          translateX.setValue(Math.min(0, gestureState.dx));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          // Snap open
          Animated.spring(translateX, {
            toValue: -140,
            friction: 7,
            useNativeDriver: true,
          }).start();
        } else {
          // Snap close
          Animated.spring(translateX, {
            toValue: 0,
            friction: 7,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const closeActions = () => {
    Animated.spring(translateX, {
      toValue: 0,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.cardContainer}>
      {/* Hidden Swipe Actions (Modify & Close) */}
      <View style={styles.actionsContainer}>
        {/* Modify Action (Green) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            closeActions();
            onModify?.();
          }}
          style={styles.modifyAction}
        >
          <Ionicons name="create-outline" size={22} color="#FFFFFF" />
          <Text style={styles.actionText}>Modify</Text>
        </TouchableOpacity>

        {/* Close Action (Red) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            closeActions();
            onClose?.();
          }}
          style={styles.closeAction}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
          <Text style={styles.actionText}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Foreground Swipeable Card */}
      <Animated.View
        style={[
          styles.cardForeground,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          style={styles.cardInner}
        >
          {/* Left Side: Dynamic Symbol Icon + Name + Buy lot text */}
          <View style={styles.leftRow}>
            <View style={styles.symbolIconWrapper}>
              <SymbolIcon symbol={order.symbol} size={36} />
            </View>

            <View style={styles.symbolInfo}>
              <Text style={styles.symbolName}>{order.symbol}</Text>
              <Text style={styles.orderDetailText}>
                <Text style={styles.buyText}>{order.type} {order.lot} lot</Text> at {order.openPrice}
              </Text>
            </View>
          </View>

          {/* Right Side: P/L in red/green + Current live price */}
          <View style={styles.rightColumn}>
            <Text
              style={[
                styles.pnlText,
                { color: order.isProfit ? '#10B981' : '#EF4444' },
              ]}
            >
              {order.pnl} USD
            </Text>
            <Text style={styles.currentPriceText}>{order.currentPrice}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 6,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 140,
    flexDirection: 'row',
  },
  modifyAction: {
    width: 70,
    backgroundColor: '#34D399', // Fresh vibrant green from screenshot
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeAction: {
    width: 70,
    backgroundColor: '#F87171', // Soft coral red from screenshot
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  cardForeground: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolIconWrapper: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolInfo: {
    justifyContent: 'center',
  },
  symbolName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  orderDetailText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },
  buyText: {
    color: '#2563EB', // Blue "Buy 0.02 lot"
    fontWeight: '500',
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pnlText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  currentPriceText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },
});
