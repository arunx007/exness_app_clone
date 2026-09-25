import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';

export const FLAG_BY_CURRENCY: Record<string, string> = {
  AED: 'ae',
  AUD: 'au',
  BRL: 'br',
  CAD: 'ca',
  CHF: 'ch',
  CNY: 'cn',
  CZK: 'cz',
  DKK: 'dk',
  EUR: 'eu',
  GBP: 'gb',
  HKD: 'hk',
  HUF: 'hu',
  ILS: 'il',
  INR: 'in',
  JPY: 'jp',
  KRW: 'kr',
  MXN: 'mx',
  NOK: 'no',
  NZD: 'nz',
  PLN: 'pl',
  RUB: 'ru',
  SAR: 'sa',
  SEK: 'se',
  SGD: 'sg',
  THB: 'th',
  TRY: 'tr',
  USD: 'us',
  ZAR: 'za',
};

export const TOKEN_STYLE: Record<string, { label: string; background: string; color?: string }> = {
  BNB: { label: 'BNB', background: '#F3BA2F', color: '#1E2329' },
  BTC: { label: '₿', background: '#F7931A', color: '#FFFFFF' },
  DOG: { label: 'Ð', background: '#C2A633', color: '#FFFFFF' },
  ETH: { label: 'Ξ', background: '#627EEA', color: '#FFFFFF' },
  SOL: { label: 'S', background: '#14F195', color: '#111827' },
  USDC: { label: '$', background: '#2775CA', color: '#FFFFFF' },
  USDT: { label: '₮', background: '#26A17B', color: '#FFFFFF' },
  XAG: { label: 'Ag', background: '#A7ABB4', color: '#111827' },
  XAU: { label: 'Au', background: '#D4AF37', color: '#3B2F00' },
  XRP: { label: 'X', background: '#23292F', color: '#FFFFFF' },
  USOIL: { label: 'OIL', background: '#1F2937', color: '#FFFFFF' },
  OIL: { label: 'OIL', background: '#1F2937', color: '#FFFFFF' },
  NAS100: { label: 'NQ', background: '#1E3A8A', color: '#FFFFFF' },
  US30: { label: '30', background: '#1E3A8A', color: '#FFFFFF' },
};

const KNOWN_CODES = [
  ...Object.keys(FLAG_BY_CURRENCY),
  ...Object.keys(TOKEN_STYLE),
].sort((left, right) => right.length - left.length);

/** Split a broker symbol into up to two known asset codes (e.g. XAUUSD -> XAU, USD; EURUSD -> EUR, USD). */
export function getSymbolAssets(symbol: string): string[] {
  if (!symbol) return [];
  const value = symbol.trim().toUpperCase().replace('/', '');

  // 1. Check if first 3 and next 3 are known currencies (Forex pairs: USDCHF, USDCAD, EURUSD, GBPJPY)
  const first3 = value.slice(0, 3);
  const next3 = value.slice(3, 6);
  if (FLAG_BY_CURRENCY[first3] && FLAG_BY_CURRENCY[next3]) {
    return [first3, next3];
  }

  const first = KNOWN_CODES.find((code) => value.startsWith(code));
  if (!first) return [];
  const remainder = value.slice(first.length);
  const second = KNOWN_CODES.find((code) => remainder.startsWith(code));
  return second ? [first, second] : [first];
}

interface SymbolIconProps {
  symbol: string;
  size?: number;
  fallback?: string;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}

/** Overlapping currency/asset marks supporting flags & tokens. */
export const SymbolIcon: React.FC<SymbolIconProps> = ({
  symbol,
  size = 32,
  fallback,
  borderColor = '#FFFFFF',
  style,
}) => {
  const assets = useMemo(() => getSymbolAssets(symbol), [symbol]);
  const [failedFlags, setFailedFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFailedFlags({});
  }, [symbol]);

  if (assets.length === 0) {
    const textFallback = fallback || (symbol ? symbol.slice(0, 2).toUpperCase() : '?');
    return (
      <View
        style={[
          styles.fallback,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#E5E7EB',
            borderColor,
          },
          style,
        ]}
      >
        <Text
          style={{
            fontSize: size * 0.4,
            fontWeight: '700',
            color: '#4B5563',
          }}
        >
          {textFallback}
        </Text>
      </View>
    );
  }

  const overlap = Math.round(size * 0.45);
  const totalWidth = assets.length > 1 ? size + overlap : size;

  return (
    <View
      style={[
        {
          width: totalWidth,
          height: size,
          justifyContent: 'center',
          position: 'relative',
        },
        style,
      ]}
      accessibilityLabel={symbol}
    >
      {assets.slice(0, 2).map((asset, index) => (
        <AssetMark
          key={`${asset}-${index}`}
          asset={asset}
          size={size}
          failed={Boolean(failedFlags[asset])}
          onFlagError={() =>
            setFailedFlags((current) => ({ ...current, [asset]: true }))
          }
          style={{
            position: 'absolute',
            left: index * overlap,
            top: 0,
            zIndex: index === 0 ? 2 : 1,
            borderColor,
          }}
        />
      ))}
    </View>
  );
};

interface AssetMarkProps {
  asset: string;
  size: number;
  failed: boolean;
  onFlagError: () => void;
  style: StyleProp<ViewStyle>;
}

const AssetMark: React.FC<AssetMarkProps> = ({
  asset,
  size,
  failed,
  onFlagError,
  style,
}) => {
  const token = TOKEN_STYLE[asset];
  const flag = FLAG_BY_CURRENCY[asset];

  if (flag && !failed) {
    return (
      <View
        style={[
          styles.mark,
          style,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
          },
        ]}
      >
        <Image
          source={{ uri: `https://flagcdn.com/w80/${flag}.png` }}
          onError={onFlagError}
          resizeMode="cover"
          style={{ width: size, height: size }}
        />
      </View>
    );
  }

  const label = token?.label ?? asset.slice(0, 2);
  return (
    <View
      style={[
        styles.mark,
        styles.token,
        style,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: token?.background ?? '#6B7280',
        },
      ]}
    >
      <Text
        style={{
          color: token?.color ?? '#FFFFFF',
          fontSize: label.length > 2 ? size * 0.28 : size * 0.46,
          lineHeight: size * 0.58,
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  mark: {
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  token: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
