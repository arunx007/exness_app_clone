import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export interface AccountSwitchState {
  login: string;
  isDemo: boolean;
  done: boolean;
}

interface AccountSwitchOverlayProps {
  switchState: AccountSwitchState | null;
}

export const AccountSwitchOverlay: React.FC<AccountSwitchOverlayProps> = ({ switchState }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const checkScaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (switchState) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [Boolean(switchState)]);

  useEffect(() => {
    if (switchState?.done) {
      Animated.spring(checkScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();
    } else {
      checkScaleAnim.setValue(0.5);
    }
  }, [switchState?.done]);

  if (!switchState) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.overlayContainer,
        { opacity: fadeAnim },
      ]}
      pointerEvents="auto"
    >
      <BlurView intensity={Platform.OS === 'ios' ? 60 : 100} tint="light" style={styles.blur}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Status Icon */}
          <View style={styles.iconContainer}>
            {switchState.done ? (
              <Animated.View style={{ transform: [{ scale: checkScaleAnim }] }}>
                <Ionicons name="checkmark-circle" size={50} color="#10B981" />
              </Animated.View>
            ) : (
              <ActivityIndicator size="large" color="#F59E0B" />
            )}
          </View>

          {/* Account Login */}
          <Text style={styles.loginText}>#{switchState.login}</Text>

          {/* Demo/Real Pill */}
          <View
            style={[
              styles.typePill,
              {
                backgroundColor: switchState.isDemo ? '#FEF3C7' : '#DCFCE7',
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: switchState.isDemo ? '#D97706' : '#16A34A' },
              ]}
            />
            <Text
              style={[
                styles.typeLabel,
                { color: switchState.isDemo ? '#B45309' : '#15803D' },
              ]}
            >
              {switchState.isDemo ? 'Demo Account' : 'Real Account'}
            </Text>
          </View>

          {/* Status Caption */}
          <Text style={styles.statusText}>
            {switchState.done ? 'You’re all set' : 'Switching account…'}
          </Text>
        </Animated.View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    zIndex: 9999,
    elevation: 9999,
  },
  blur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  card: {
    minWidth: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loginText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
