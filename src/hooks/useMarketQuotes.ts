import { useEffect, useRef, useState, useCallback } from 'react';
import { marketSocket, MarketTick } from '../api/sockets/marketSocket';
import { marketSymbolsMatch } from '../utils/symbol';

export type LiveQuoteData = {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  changePercent?: number;
  time?: number;
};

export type QuotesMap = Record<string, LiveQuoteData>;

const UPDATE_INTERVAL_MS = 60;

/**
 * Live market quotes hook subscribing via marketSocket.
 * Batches incoming ticks to avoid excessive re-renders while keeping high responsiveness.
 */
export function useMarketQuotes(symbolNames: string[]) {
  const [quotes, setQuotes] = useState<QuotesMap>({});
  const pendingUpdates = useRef<Map<string, LiveQuoteData>>(new Map());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const symbolsKey = symbolNames.slice().sort().join(',');

  const flush = useCallback(() => {
    flushTimer.current = null;
    if (pendingUpdates.current.size === 0) return;

    const entries = [...pendingUpdates.current.entries()];
    pendingUpdates.current.clear();

    setQuotes((prev) => {
      const next = { ...prev };
      for (const [key, quote] of entries) {
        next[key] = quote;
      }
      return next;
    });
  }, []);

  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (symbolNames.length === 0) {
      if (isConnectedRef.current) {
        marketSocket.setSymbols([]);
      }
      return;
    }

    const enqueueTick = (tick: MarketTick) => {
      // Find matching requested symbol
      const matched = symbolNames.find((s) => marketSymbolsMatch(s, tick.symbol)) ?? tick.symbol;
      const quoteData: LiveQuoteData = {
        symbol: matched,
        bid: tick.bid,
        ask: tick.ask,
        spread: tick.spread,
        changePercent: tick.changePercent,
        time: tick.time,
      };

      pendingUpdates.current.set(matched, quoteData);

      if (!flushTimer.current) {
        flushTimer.current = setTimeout(flush, UPDATE_INTERVAL_MS);
      }
    };

    if (!isConnectedRef.current) {
      isConnectedRef.current = true;
      marketSocket.connect(symbolNames, {
        onTick: enqueueTick,
        onSnapshot: (ticks) => ticks.forEach(enqueueTick),
      });
    } else {
      marketSocket.setSymbols(symbolNames);
    }
  }, [symbolsKey, flush]);

  useEffect(() => {
    return () => {
      isConnectedRef.current = false;
      marketSocket.disconnect();
      if (flushTimer.current) {
        clearTimeout(flushTimer.current);
        flushTimer.current = null;
      }
      pendingUpdates.current.clear();
    };
  }, []);

  return quotes;
}
