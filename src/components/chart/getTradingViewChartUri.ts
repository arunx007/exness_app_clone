import { Platform } from 'react-native';
import { bundleDirectory } from 'expo-file-system/legacy';

type ChartUriParams = {
  symbol: string;
  tradingSymbol: string;
  interval: string;
  theme: 'dark' | 'light';
  /** Pane / page background — match app systemBackground. */
  background?: string;
  price?: number;
  serverTimeOffset?: number;
};

/**
 * Local TradingView Charting Library URI resolver.
 * In development, loads via Metro static middleware at http://localhost:8081/tradingview/chart.html.
 * In Android release, loads from file:///android_asset/tradingview/chart.html.
 * In iOS release, loads from bundleDirectory.
 */
export function getTradingViewChartUri(params: ChartUriParams): string {
  const background =
    params.background ?? (params.theme === 'light' ? '#FFFFFF' : '#000000');
  const query = new URLSearchParams({
    symbol: params.symbol.toUpperCase(),
    tradingSymbol: params.tradingSymbol.toUpperCase(),
    interval: params.interval,
    theme: params.theme,
    background,
    price: String(params.price ?? 0),
    serverTimeOffset: String(params.serverTimeOffset ?? 0),
  }).toString();

  if (__DEV__) {
    return `http://localhost:8081/tradingview/chart.html?${query}#${query}`;
  }

  if (Platform.OS === 'android') {
    return `file:///android_asset/tradingview/chart.html?${query}`;
  }

  const base = bundleDirectory ?? '';
  const dir = base.startsWith('file://') ? base : `file://${base}`;
  return `${dir}${dir.endsWith('/') ? '' : '/'}assets/tradingview/chart.html#${query}`;
}

export const TRADINGVIEW_WEBVIEW_PROPS = {
  javaScriptEnabled: true,
  domStorageEnabled: true,
  allowFileAccess: true,
  originWhitelist: ['*'] as string[],
  mixedContentMode: 'compatibility' as const,
  allowFileAccessFromFileURLs: true,
  allowUniversalAccessFromFileURLs: true,
};
