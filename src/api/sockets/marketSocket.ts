import { apiConfig } from '../config';
import type { ChartQuote, ChartSocketStatus } from './chartSocket';

export { marketSymbolsMatch, normalizeMarketSymbol } from '../../utils/symbol';

export type MarketTick = ChartQuote & {
  spread: number;
  changePercent?: number;
  /** Unix time in seconds. */
  time?: number;
};

export type MarketSocketHandlers = {
  onTick: (tick: MarketTick) => void;
  onSnapshot?: (ticks: MarketTick[]) => void;
  onStatusChange?: (status: ChartSocketStatus) => void;
  onError?: (message: string) => void;
};

function toFiniteNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseTick(raw: Record<string, unknown>): MarketTick | null {
  const symbol = String(raw.symbol ?? raw.Symbol ?? raw.s ?? '').trim();
  if (!symbol) return null;

  const bid = toFiniteNumber(raw.bid ?? raw.Bid ?? raw.b);
  const ask = toFiniteNumber(raw.ask ?? raw.Ask ?? raw.a, bid);
  if (bid <= 0 || ask <= 0) return null;

  const spread = toFiniteNumber(raw.spread ?? raw.Spread ?? raw.spr, ask - bid);
  const explicitChange = toFiniteNumber(
    raw.changePercent ?? raw.changePct ?? raw.ChangePct ?? raw.percent ?? raw.Percent,
    Number.NaN,
  );
  const dayOpen = toFiniteNumber(raw.dayOpen ?? raw.DayOpen ?? raw.open ?? raw.Open);
  const changePercent = Number.isFinite(explicitChange)
    ? explicitChange
    : dayOpen > 0
      ? ((bid - dayOpen) / dayOpen) * 100
      : undefined;

  const rawTime = Number(raw.time ?? raw.Time ?? raw.t ?? raw.ts);
  const time =
    Number.isFinite(rawTime) && rawTime > 0
      ? rawTime > 1e11
        ? rawTime / 1_000
        : rawTime
      : undefined;
  return {
    symbol,
    bid,
    ask,
    spread,
    changePercent,
    time,
  };
}

/**
 * MT5 live market quote socket (watchlist / prices).
 *
 * Subscribes to `watch` streams for a set of symbols and emits ticks.
 * Reconnects automatically while symbols remain subscribed.
 */
export class MarketSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private handlers: MarketSocketHandlers | null = null;
  private symbols = new Set<string>();

  connect(symbols: string[], handlers: MarketSocketHandlers): void {
    this.disconnect();
    this.symbols = new Set(symbols.map((symbol) => symbol.trim()).filter(Boolean));
    this.handlers = handlers;
    this.open();
  }

  /** Add symbols to an active subscription. */
  subscribe(symbols: string[]): void {
    const added: string[] = [];
    for (const raw of symbols) {
      const symbol = raw.trim();
      if (symbol && !this.symbols.has(symbol)) {
        this.symbols.add(symbol);
        added.push(symbol);
      }
    }
    if (added.length > 0) {
      this.sendCurrentSubscription();
    }
  }

  /** Remove symbols from an active subscription. */
  unsubscribe(symbols: string[]): void {
    const removed: string[] = [];
    for (const raw of symbols) {
      const symbol = raw.trim();
      if (symbol && this.symbols.delete(symbol)) removed.push(symbol);
    }
    if (removed.length > 0) {
      this.sendCurrentSubscription();
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.handlers = null;
    this.reconnectAttempt = 0;
    this.symbols.clear();
    this.socket?.close();
    this.socket = null;
  }

  private open(): void {
    if (!this.handlers || this.symbols.size === 0) return;

    this.handlers.onStatusChange?.('connecting');
    const candidates = [
      apiConfig.mt5.socketUrl,
      'wss://chart.broker-bros.com/ws',
      'wss://chart.broker-bros.com',
    ].filter((url, idx, self) => Boolean(url) && self.indexOf(url) === idx);
    const targetUrl = candidates[this.reconnectAttempt % candidates.length] ?? 'wss://chart.broker-bros.com/ws';
    this.socket = new WebSocket(targetUrl);

    this.socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.handlers?.onStatusChange?.('connected');
      this.sendCurrentSubscription();
    };

    this.socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(String(event.data)) as unknown;
        if (Array.isArray(parsed)) {
          this.handleMessage({ data: parsed });
        } else if (parsed && typeof parsed === 'object') {
          this.handleMessage(parsed as Record<string, unknown>);
        }
      } catch {
        this.handlers?.onError?.('Market socket returned invalid data');
      }
    };

    this.socket.onerror = () => {
      this.handlers?.onError?.('Unable to connect to market socket');
      this.socket?.close();
    };

    this.socket.onclose = () => {
      this.socket = null;
      this.handlers?.onStatusChange?.('disconnected');
      if (!this.handlers || this.symbols.size === 0) return;
      const delay = Math.min(1_000 * 2 ** this.reconnectAttempt, 15_000);
      this.reconnectAttempt += 1;
      this.reconnectTimer = setTimeout(() => this.open(), delay);
    };
  }

  private handleMessage(message: Record<string, unknown>): void {
    const data = message.data;
    const candidates = Array.isArray(data)
      ? data
      : Array.isArray(message.ticks)
        ? message.ticks
        : Array.isArray(message.quotes)
          ? message.quotes
          : data && typeof data === 'object'
            ? [data]
            : [message];

    const ticks = candidates
      .map((item) =>
        item && typeof item === 'object'
          ? parseTick(item as Record<string, unknown>)
          : null,
      )
      .filter((item): item is MarketTick => item !== null);

    if (ticks.length > 1) {
      this.handlers?.onSnapshot?.(ticks);
    } else if (ticks[0]) {
      this.handlers?.onTick(ticks[0]);
    }
  }

  private send(payload: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  private sendCurrentSubscription(): void {
    if (this.symbols.size === 0) return;
    this.send({
      type: 'sub_symbols',
      symbols: [...this.symbols],
      streams: ['watch'],
    });
  }
}

export const marketSocket = new MarketSocketService();
