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

export const TRADING_SIGNALS: TradingSignalItem[] = [
  {
    id: 'sig-pm',
    symbol: 'PM',
    name: 'Philip Morris International',
    timeframe: 'DAILY',
    timestamp: 'Friday, September 25, 2026 11:51:12 PM CET',
    subtitle: '— MA 20 + BB  — MA 50   Research © 2026 Trading Central',
    headline: 'PM: Towards 203.26',
    direction: 'bullish',
    pillLabel: '↑ Short term',
    time: '03:21',
    entryPrice: 190.48,
    targetPrice: 203.26,
    stopLoss: 178.17,
    supportLevels: [178.17, 174.05],
    resistanceLevels: [207.48, 203.26],
    candleData: [
      { x: 10, o: 176, h: 182, l: 174, c: 180 },
      { x: 25, o: 180, h: 185, l: 177, c: 178 },
      { x: 40, o: 178, h: 183, l: 175, c: 182 },
      { x: 55, o: 182, h: 189, l: 181, c: 188 },
      { x: 70, o: 188, h: 191, l: 184, c: 186 },
      { x: 85, o: 186, h: 193, l: 185, c: 191 },
      { x: 100, o: 191, h: 194, l: 187, c: 190 },
      { x: 115, o: 190, h: 196, l: 189, c: 195 },
    ],
  },
  {
    id: 'sig-unh',
    symbol: 'UNH',
    name: 'UnitedHealth',
    timeframe: 'DAILY',
    timestamp: 'Friday, September 25, 2026 11:51:12 PM CET',
    subtitle: '— MA 20 + BB  — MA 50   Research © 2026 Trading Central',
    headline: 'UNH: Aim at 350.00',
    direction: 'bearish',
    pillLabel: '↓↓ Short term',
    time: '04:15',
    entryPrice: 382.5,
    targetPrice: 350.0,
    stopLoss: 405.0,
    supportLevels: [350.0, 342.0],
    resistanceLevels: [398.0, 405.0],
    candleData: [
      { x: 10, o: 395, h: 402, l: 392, c: 398 },
      { x: 25, o: 398, h: 406, l: 395, c: 404 },
      { x: 40, o: 404, h: 408, l: 398, c: 400 },
      { x: 55, o: 400, h: 402, l: 388, c: 390 },
      { x: 70, o: 390, h: 394, l: 382, c: 385 },
      { x: 85, o: 385, h: 389, l: 380, c: 382 },
      { x: 100, o: 382, h: 385, l: 374, c: 376 },
      { x: 115, o: 376, h: 378, l: 368, c: 370 },
    ],
  },
  {
    id: 'sig-xau',
    symbol: 'XAUUSD',
    name: 'Gold / US Dollar',
    timeframe: '1H',
    timestamp: 'Friday, September 25, 2026 11:51:12 PM CET',
    subtitle: '— MA 20 + BB  — MA 50   Research © 2026 Trading Central',
    headline: 'XAUUSD: Towards 2680.50',
    direction: 'bullish',
    pillLabel: '↑ Short term',
    time: '02:40',
    entryPrice: 2654.8,
    targetPrice: 2680.5,
    stopLoss: 2635.0,
    supportLevels: [2635.0, 2620.0],
    resistanceLevels: [2680.5, 2695.0],
    candleData: [
      { x: 10, o: 2630, h: 2638, l: 2625, c: 2635 },
      { x: 25, o: 2635, h: 2642, l: 2631, c: 2639 },
      { x: 40, o: 2639, h: 2648, l: 2636, c: 2645 },
      { x: 55, o: 2645, h: 2652, l: 2641, c: 2649 },
      { x: 70, o: 2649, h: 2658, l: 2646, c: 2655 },
      { x: 85, o: 2655, h: 2662, l: 2651, c: 2659 },
      { x: 100, o: 2659, h: 2666, l: 2655, c: 2664 },
      { x: 115, o: 2664, h: 2672, l: 2660, c: 2670 },
    ],
  },
  {
    id: 'sig-btc',
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    timeframe: '4H',
    timestamp: 'Friday, September 25, 2026 11:51:12 PM CET',
    subtitle: '— MA 20 + BB  — MA 50   Research © 2026 Trading Central',
    headline: 'BTC: Towards 87500.00',
    direction: 'bullish',
    pillLabel: '↑ Short term',
    time: '05:10',
    entryPrice: 84025.0,
    targetPrice: 87500.0,
    stopLoss: 82100.0,
    supportLevels: [82100.0, 80500.0],
    resistanceLevels: [87500.0, 89000.0],
    candleData: [
      { x: 10, o: 81500, h: 82400, l: 81000, c: 82200 },
      { x: 25, o: 2635, h: 83100, l: 82000, c: 82800 },
      { x: 40, o: 82800, h: 83500, l: 82400, c: 83300 },
      { x: 55, o: 83300, h: 84200, l: 83000, c: 83900 },
      { x: 70, o: 83900, h: 84600, l: 83500, c: 84300 },
      { x: 85, o: 84300, h: 85200, l: 84000, c: 84900 },
      { x: 100, o: 84900, h: 85800, l: 84500, c: 85400 },
      { x: 115, o: 85400, h: 86400, l: 85000, c: 86100 },
    ],
  },
];
