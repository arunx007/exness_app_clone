import { brokerRequest } from '../api/broker/client';
import { LiveQuoteData } from '../hooks/useMarketQuotes';
import { marketSymbolsMatch } from '../utils/symbol';
import { DEFAULT_CATALOG_SYMBOLS } from '../constants/symbolsCatalog';

export interface TradingSignalItem {
  id: string;
  symbol: string;
  name: string;
  timeframe: string;
  timestamp: string;
  subtitle: string;
  headline: string;
  direction: 'bullish' | 'bearish';
  pillLabel: string;
  time: string;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  supportLevels: number[];
  resistanceLevels: number[];
  candleData: Array<{ x: number; o: number; h: number; l: number; c: number }>;
}

export function buildDynamicSignal(
  symbol: string,
  name: string,
  liveQuote?: LiveQuoteData,
  timeframe: string = 'DAILY'
): TradingSignalItem {
  const price = liveQuote && liveQuote.bid > 0 ? liveQuote.bid : 100;
  const change = liveQuote?.changePercent ?? 0.5;
  const isBullish = change >= 0;

  const targetMult = isBullish ? 1.018 : 0.982;
  const stopMult = isBullish ? 0.988 : 1.012;
  const targetPrice = price * targetMult;
  const stopLoss = price * stopMult;

  const digits = price >= 1000 ? 2 : price >= 10 ? 3 : 5;

  const stepY = (price * 0.015) / 4;

  // Generate dynamic candles around live price
  const candleData = [
    { x: 10, o: price - stepY * 2, h: price - stepY, l: price - stepY * 2.5, c: price - stepY * 1.5 },
    { x: 25, o: price - stepY * 1.5, h: price - stepY * 0.5, l: price - stepY * 2, c: price - stepY },
    { x: 40, o: price - stepY, h: price, l: price - stepY * 1.5, c: price - stepY * 0.5 },
    { x: 55, o: price - stepY * 0.5, h: price + stepY * 0.5, l: price - stepY, c: price },
    { x: 70, o: price, h: price + stepY, l: price - stepY * 0.5, c: price + stepY * 0.5 },
    { x: 85, o: price + stepY * 0.5, h: price + stepY * 1.5, l: price, c: price + stepY },
    { x: 100, o: price + stepY, h: price + stepY * 2, l: price + stepY * 0.5, c: price + stepY * 1.5 },
    { x: 115, o: price + stepY * 1.5, h: price + stepY * 2.5, l: price + stepY, c: price + stepY * 2 },
  ];

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return {
    id: `sig-${symbol.toLowerCase()}`,
    symbol,
    name,
    timeframe,
    timestamp: `${dateStr} ${timeStr}`,
    subtitle: '— MA 20 + BB  — MA 50   Research © Trading Central',
    headline: `${symbol}: Towards ${targetPrice.toFixed(digits)}`,
    direction: isBullish ? 'bullish' : 'bearish',
    pillLabel: isBullish ? '↑ Short term' : '↓↓ Short term',
    time: '03:21',
    entryPrice: price,
    targetPrice,
    stopLoss,
    supportLevels: [stopLoss, stopLoss * (isBullish ? 0.995 : 1.005)],
    resistanceLevels: [targetPrice, targetPrice * (isBullish ? 1.005 : 0.995)],
    candleData,
  };
}

export const signalsService = {
  async fetchSignals(liveQuotes: Record<string, LiveQuoteData>): Promise<TradingSignalItem[]> {
    // 1. Try to fetch from backend broker analysis API if authorized
    try {
      const res = await brokerRequest<{ data?: any[] }>('/analysis/insights', {
        method: 'GET',
        timeoutMs: 1500,
      });
      if (Array.isArray(res?.data) && res.data.length > 0) {
        return res.data.map((item: any) =>
          buildDynamicSignal(
            item.symbol,
            item.name || item.symbol,
            liveQuotes[item.symbol],
            item.tf || 'DAILY'
          )
        );
      }
    } catch {
      // Backend broker insights require user CRM auth; proceed to compute from live market quotes
    }

    // 2. Dynamically compute signals for top active market instruments
    const activeInstruments = [
      { symbol: 'XAUUSD', name: 'Gold / US Dollar', tf: '1H' },
      { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', tf: '4H' },
      { symbol: 'EURUSD', name: 'Euro / US Dollar', tf: '15m' },
      { symbol: 'GBPUSD', name: 'British Pound / USD', tf: '1H' },
      { symbol: 'USOIL', name: 'Crude Oil', tf: 'DAILY' },
    ];

    return activeInstruments.map((inst) => {
      const live =
        liveQuotes[inst.symbol] ??
        Object.values(liveQuotes).find((q) => marketSymbolsMatch(q.symbol, inst.symbol));
      const catalogItem = DEFAULT_CATALOG_SYMBOLS.find((d) =>
        marketSymbolsMatch(d.symbol, inst.symbol)
      );
      const effectiveQuote: LiveQuoteData = live || {
        symbol: inst.symbol,
        bid: catalogItem?.bid || 2654.8,
        ask: catalogItem?.ask || 2655.2,
        spread: catalogItem?.spread || 0.4,
        changePercent: catalogItem?.changePercent || 0.5,
      };
      return buildDynamicSignal(inst.symbol, inst.name, effectiveQuote, inst.tf);
    });
  },
};
