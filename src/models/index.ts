export interface TradingAccount {
  id: string;
  accountNumber: string;
  server: string;
  platform: 'MT4' | 'MT5';
  type: 'REAL' | 'DEMO';
  currency: string;
  balance: number;
  equity: number;
  freeMargin: number;
  marginLevel: number;
  leverage: string;
}

export interface MarketSymbol {
  symbol: string;
  name: string;
  category: 'Forex' | 'Crypto' | 'Commodities' | 'Indices' | 'Stocks';
  bid: number;
  ask: number;
  spread: number;
  change24h: number;
  digits: number;
}

export interface Position {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  currentPrice: number;
  sl?: number;
  tp?: number;
  profit: number;
  openTime: string;
}
