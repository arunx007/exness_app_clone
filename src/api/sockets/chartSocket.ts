import { Platform } from 'react-native';

import { apiConfig } from '../config';

export type ChartCandle = {
  /** Unix time in milliseconds */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type ChartQuote = {
  symbol: string;
  bid: number;
  ask: number;
  time?: number;
};

export type ChartSocketStatus = 'connecting' | 'connected' | 'disconnected';

export type ChartSocketHandlers = {
  onHistory: (candles: ChartCandle[]) => void;
  onCandle: (candle: ChartCandle) => void;
  onQuote?: (quote: ChartQuote) => void;
  onStatusChange?: (status: ChartSocketStatus) => void;
  onError?: (message: string) => void;
};

/**
 * Candle-feed identity for the MT5 WS.
 * Keeps broker suffixes for trading elsewhere, but history usually needs the base feed symbol.
 */
export function normalizeChartSymbol(symbol: string): string {
  if (!symbol) return '';
  return (
    symbol
      .split('.')[0]
      ?.trim()
      .replace(/[macfhr]+$/i, '')
      .toUpperCase() ?? ''
  );
}

/** Exact broker/watchlist symbol used for orders and UI labels. */
export function toTradingSymbol(symbol: string): string {
  return String(symbol ?? '').trim();
}

/** Exact broker/watchlist symbol used for orders and UI labels. */
export function normalizeTradingSymbol(symbol: string): string {
  return String(symbol || '').trim().toUpperCase();
}

export function resolutionToSocketTimeframe(resolution: string): string {
  const timeframes: Record<string, string> = {
    '1': 'M1',
    '3': 'M3',
    '5': 'M5',
    '15': 'M15',
    '30': 'M30',
    '60': 'H1',
    '240': 'H4',
    D: 'D1',
    '1D': 'D1',
    W: 'W1',
    '1W': 'W1',
    M: 'Mn1',
    '1M': 'Mn1',
    M1: 'M1',
    M3: 'M3',
    M5: 'M5',
    M15: 'M15',
    M30: 'M30',
    H1: 'H1',
    H4: 'H4',
    D1: 'D1',
    W1: 'W1',
    Mn1: 'Mn1',
  };
  return timeframes[resolution] ?? resolution;
}

export function socketTimeframeToMs(timeframe: string): number {
  const norm = resolutionToSocketTimeframe(timeframe);
  switch (norm) {
    case 'M1':
      return 60_000;
    case 'M3':
      return 180_000;
    case 'M5':
      return 300_000;
    case 'M15':
      return 900_000;
    case 'M30':
      return 1_800_000;
    case 'H1':
      return 3_600_000;
    case 'H4':
      return 14_400_000;
    case 'D1':
      return 86_400_000;
    default:
      return 900_000;
  }
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeTime(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return number < 1e12 ? number * 1000 : number;
}

function chartSymbolsMatch(left: string, right: string): boolean {
  const a = normalizeChartSymbol(left);
  const b = normalizeChartSymbol(right);
  if (!a || !b) return false;
  if (a === b) return true;
  return a.length >= 6 && b.length >= 6 && (a.startsWith(b) || b.startsWith(a));
}

function extractCandleRows(message: Record<string, unknown>): unknown[] {
  const direct = message.candles ?? message.Candles ?? message.bars ?? message.Bars;
  if (Array.isArray(direct)) return direct;

  const nested =
    message.data ?? message.Data ?? message.result ?? message.Result ?? message.payload;
  if (Array.isArray(nested)) return nested;
  if (nested && typeof nested === 'object') {
    const record = nested as Record<string, unknown>;
    const rows = record.candles ?? record.Candles ?? record.bars ?? record.Bars;
    if (Array.isArray(rows)) return rows;
  }
  return [];
}

function parseCandle(raw: Record<string, unknown>): ChartCandle | null {
  const time = normalizeTime(
    raw.t ?? raw.time ?? raw.Time ?? raw.timestamp ?? raw.Timestamp ?? raw.date,
  );
  if (time <= 0) return null;

  const open = toFiniteNumber(raw.o ?? raw.open ?? raw.Open);
  const close = toFiniteNumber(raw.c ?? raw.close ?? raw.Close, open);
  if (open <= 0 && close <= 0) return null;

  const high = toFiniteNumber(raw.h ?? raw.high ?? raw.High, Math.max(open, close));
  const low = toFiniteNumber(raw.l ?? raw.low ?? raw.Low, Math.min(open, close));

  return { time, open, high, low, close };
}

function closeSocketSafely(socket: WebSocket): void {
  socket.onmessage = null;
  socket.onerror = null;
  socket.onclose = null;

  const forceClose = () => {
    socket.onopen = null;
    try {
      if (
        socket.readyState === WebSocket.CONNECTING ||
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CLOSING
      ) {
        socket.close();
      }
    } catch {
      // WebKit / state transitions
    }
  };

  if (Platform.OS === 'android' || socket.readyState !== WebSocket.CONNECTING) {
    forceClose();
    return;
  }

  socket.onopen = () => {
    forceClose();
  };
}

/**
 * MT5 candle/quote socket used by the chart.
 */
export class ChartSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private historyRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private sendQueue: string[] = [];
  private handlers: ChartSocketHandlers | null = null;
  private tradingSymbol = '';
  private feedSymbol = '';
  private timeframe = 'M15';
  private historyCount = 1_000;
  private lastBars: ChartCandle | null = null;
  private historyRetryAttempt = 0;
  private historyReceived = false;
  private connectionGeneration = 0;
  private reconnectAttempt = 0;
  private brokerOffsetMs = 0;

  getBrokerOffsetMs(): number {
    return this.brokerOffsetMs;
  }

  connect(
    symbol: string,
    resolution: string,
    handlers: ChartSocketHandlers,
    historyCount = 1_000,
  ): void {
    this.tradingSymbol = toTradingSymbol(symbol);
    this.feedSymbol = normalizeChartSymbol(symbol) || this.tradingSymbol;
    this.timeframe = resolutionToSocketTimeframe(resolution);
    this.historyCount = historyCount;
    this.handlers = handlers;
    this.lastBars = null;
    this.historyRetryAttempt = 0;
    this.historyReceived = false;
    this.sendQueue = [];

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      if (this.socket.readyState === WebSocket.OPEN) {
        this.handlers.onStatusChange?.('connected');
        this.subscribe();
        this.sendHistoryRequests();
        this.scheduleHistoryRetry();
      } else {
        this.handlers.onStatusChange?.('connecting');
      }
      return;
    }

    if (this.socket) {
      closeSocketSafely(this.socket);
      this.socket = null;
    }
    this.open();
  }

  requestHistory(
    symbol = this.feedSymbol,
    resolution = this.timeframe,
    count = this.historyCount,
  ): void {
    const nextTrading = toTradingSymbol(symbol);
    const nextFeed = normalizeChartSymbol(symbol) || nextTrading || this.feedSymbol;
    if (nextTrading) this.tradingSymbol = nextTrading;
    if (nextFeed) this.feedSymbol = nextFeed;
    this.timeframe = resolutionToSocketTimeframe(resolution);
    this.historyCount = count;
    this.historyReceived = false;
    this.historyRetryAttempt = 0;
    this.sendHistoryRequests();
    this.scheduleHistoryRetry();
  }

  disconnect(): void {
    this.connectionGeneration += 1;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.historyRetryTimer) {
      clearTimeout(this.historyRetryTimer);
      this.historyRetryTimer = null;
    }
    this.handlers = null;
    this.sendQueue = [];
    this.lastBars = null;
    this.historyReceived = false;
    this.historyRetryAttempt = 0;
    const socket = this.socket;
    this.socket = null;
    if (socket) closeSocketSafely(socket);
  }

  private open(): void {
    if (!this.handlers || !this.feedSymbol) return;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const generation = ++this.connectionGeneration;
    this.handlers.onStatusChange?.('connecting');
    const candidates = [
      apiConfig.mt5.socketUrl,
      'wss://chart.broker-bros.com/ws',
      'wss://chart.broker-bros.com',
    ].filter((url, idx, self) => Boolean(url) && self.indexOf(url) === idx);
    const targetUrl = candidates[this.reconnectAttempt % candidates.length] ?? 'wss://chart.broker-bros.com/ws';
    const socket = new WebSocket(targetUrl);
    this.socket = socket;

    socket.onopen = () => {
      if (
        generation !== this.connectionGeneration ||
        this.socket !== socket ||
        !this.handlers
      ) {
        closeSocketSafely(socket);
        return;
      }
      this.reconnectAttempt = 0;
      this.handlers.onStatusChange?.('connected');
      this.subscribe();
      this.sendHistoryRequests();
      this.scheduleHistoryRetry();

      while (this.sendQueue.length > 0) {
        const message = this.sendQueue.shift();
        if (message && socket.readyState === WebSocket.OPEN) socket.send(message);
      }
    };

    socket.onmessage = (event) => {
      if (
        generation !== this.connectionGeneration ||
        this.socket !== socket ||
        !this.handlers
      ) {
        return;
      }
      try {
        const message = JSON.parse(String(event.data)) as Record<string, unknown>;
        this.handleMessage(message);
      } catch {
        this.handlers?.onError?.('Chart socket returned invalid data');
      }
    };

    socket.onerror = () => {
      if (
        generation !== this.connectionGeneration ||
        this.socket !== socket ||
        !this.handlers
      ) {
        return;
      }
      this.handlers.onError?.('Unable to connect to chart socket');
    };

    socket.onclose = () => {
      if (generation !== this.connectionGeneration) return;
      if (this.socket === socket) this.socket = null;
      this.handlers?.onStatusChange?.('disconnected');
      if (!this.handlers) return;
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectAttempt += 1;
      this.reconnectTimer = setTimeout(() => this.open(), 2_500);
    };
  }

  private subscriptionSymbols(): string[] {
    const symbols = [this.feedSymbol, this.tradingSymbol]
      .map((value) => value.trim())
      .filter(Boolean);
    return [...new Set(symbols)];
  }

  private subscribe(): void {
    const symbols = this.subscriptionSymbols();
    if (!symbols.length) return;
    this.send({
      type: 'sub_symbols',
      symbols,
      streams: ['candle_live', 'watch'],
    });
  }

  private sendHistoryRequests(): void {
    for (const symbol of this.subscriptionSymbols()) {
      this.send({
        type: 'candle_history',
        symbol,
        tf: this.timeframe,
        count: this.historyCount,
      });
    }
  }

  private scheduleHistoryRetry(): void {
    if (this.historyRetryTimer) {
      clearTimeout(this.historyRetryTimer);
      this.historyRetryTimer = null;
    }
    if (!this.handlers || this.historyReceived || this.historyRetryAttempt >= 3) return;

    this.historyRetryTimer = setTimeout(() => {
      this.historyRetryTimer = null;
      if (!this.handlers || this.historyReceived) return;
      this.historyRetryAttempt += 1;
      this.sendHistoryRequests();
      this.scheduleHistoryRetry();
    }, 1_200 + this.historyRetryAttempt * 800);
  }

  private handleMessage(message: Record<string, unknown>): void {
    const type = String(message.type ?? message.Type ?? '');
    const candleRows = extractCandleRows(message);
    const hasCandles = candleRows.length > 0;

    if (
      type === 'candle_snapshot' ||
      type === 'candle_history' ||
      type === 'history' ||
      hasCandles
    ) {
      this.handleHistory(message, candleRows);
      return;
    }

    if (type === 'candle_update' || type === 'candle') {
      this.handleCandleUpdate(message);
      return;
    }

    if (type === 'watch' || type === 'tick' || type === 'quote') {
      this.handleWatch(message);
    }
  }

  private handleHistory(message: Record<string, unknown>, candleRows: unknown[]): void {
    const messageSymbol = String(message.symbol ?? message.Symbol ?? this.feedSymbol);
    if (messageSymbol && !chartSymbolsMatch(messageSymbol, this.feedSymbol)) return;

    const messageTf = String(message.tf ?? message.timeframe ?? message.Timeframe ?? '');
    if (
      messageTf &&
      resolutionToSocketTimeframe(messageTf) !== resolutionToSocketTimeframe(this.timeframe)
    ) {
      return;
    }

    const candles = candleRows
      .map((item) =>
        item && typeof item === 'object'
          ? parseCandle(item as Record<string, unknown>)
          : null,
      )
      .filter((item): item is ChartCandle => item !== null)
      .sort((left, right) => left.time - right.time);

    if (candles.length === 0) return;

    this.historyReceived = true;
    const lastBar = candles[candles.length - 1] ?? null;
    this.lastBars = lastBar;
    if (lastBar) {
      const intervalMs = socketTimeframeToMs(this.timeframe);
      if (intervalMs <= 3_600_000) {
        const clientBucketStart = Math.floor(Date.now() / intervalMs) * intervalMs;
        const diff = lastBar.time - clientBucketStart;
        const offset = Math.round(diff / 1_800_000) * 1_800_000;
        if (Math.abs(offset) <= 86_400_000) {
          this.brokerOffsetMs = offset;
        }
      }
    }
    if (this.historyRetryTimer) {
      clearTimeout(this.historyRetryTimer);
      this.historyRetryTimer = null;
    }
    this.handlers?.onHistory(candles);
  }

  private handleCandleUpdate(message: Record<string, unknown>): void {
    const messageSymbol = String(message.symbol ?? message.Symbol ?? this.feedSymbol);
    if (messageSymbol && !chartSymbolsMatch(messageSymbol, this.feedSymbol)) return;

    const messageTf = String(message.tf ?? message.timeframe ?? '');
    if (
      messageTf &&
      resolutionToSocketTimeframe(messageTf) !== resolutionToSocketTimeframe(this.timeframe)
    ) {
      return;
    }

    const candle = parseCandle(message);
    if (!candle) return;
    this.lastBars = candle;
    const intervalMs = socketTimeframeToMs(this.timeframe);
    if (intervalMs <= 3_600_000) {
      const clientBucketStart = Math.floor(Date.now() / intervalMs) * intervalMs;
      const diff = candle.time - clientBucketStart;
      const offset = Math.round(diff / 1_800_000) * 1_800_000;
      if (Math.abs(offset) <= 86_400_000) {
        this.brokerOffsetMs = offset;
      }
    }
    this.handlers?.onCandle(candle);
  }

  private handleWatch(message: Record<string, unknown>): void {
    const messageSymbol = String(message.symbol ?? message.Symbol ?? this.feedSymbol);
    if (messageSymbol && !chartSymbolsMatch(messageSymbol, this.feedSymbol)) return;

    const rawTime = Number(
      message.time ?? message.Time ?? message.t ?? message.ts ?? message.timestamp,
    );
    const time =
      Number.isFinite(rawTime) && rawTime > 0
        ? rawTime < 1e12
          ? rawTime * 1_000
          : rawTime
        : undefined;

    if (time) {
      const diff = time - Date.now();
      const offset = Math.round(diff / 1_800_000) * 1_800_000;
      if (Math.abs(offset) <= 86_400_000) {
        this.brokerOffsetMs = offset;
      }
    }

    const bid = toFiniteNumber(message.bid ?? message.Bid);
    const ask = toFiniteNumber(message.ask ?? message.Ask);
    if (bid > 0 || ask > 0) {
      this.handlers?.onQuote?.({
        symbol: this.tradingSymbol || this.feedSymbol,
        bid,
        ask,
        time,
      });
    }

    const price = bid > 0 ? bid : ask;
    if (price <= 0) return;

    const last = this.lastBars;
    const next: ChartCandle = last
      ? {
          ...last,
          high: Math.max(last.high, price),
          low: Math.min(last.low, price),
          close: price,
        }
      : {
          time: Math.floor(Date.now() / 60_000) * 60_000,
          open: price,
          high: price,
          low: price,
          close: price,
        };

    this.lastBars = next;
    this.handlers?.onCandle(next);
  }

  private send(payload: unknown): void {
    const message = JSON.stringify(payload);
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(message);
      return;
    }
    this.sendQueue.push(message);
  }
}

export const chartSocket = new ChartSocketService();
