import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'buy' | 'sell' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const { colors, brand, trading, spacing, borderRadius, typography } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceSubtle;
    switch (variant) {
      case 'primary':
        return brand.yellow;
      case 'buy':
        return trading.buy;
      case 'sell':
        return trading.sell;
      case 'secondary':
        return colors.surface;
      case 'outline':
        return 'transparent';
      default:
        return brand.yellow;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'primary':
        return brand.black;
      case 'buy':
      case 'sell':
        return '#FFFFFF';
      case 'outline':
        return colors.textPrimary;
      default:
        return colors.textPrimary;
    }
  };

  const borderStyle: ViewStyle = variant === 'outline' ? { borderWidth: 1, borderColor: colors.border } : {};

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: borderRadius.md,
        },
        borderStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text style={[styles.text, { color: getTextColor(), fontSize: typography.sizes.base }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
  },
});
