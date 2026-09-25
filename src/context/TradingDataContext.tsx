import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  mt5TradingService,
  mt5Session,
  marketSocket,
  marketSymbolsMatch,
  type Mt5Position,
  type Mt5Order,
  type Mt5HistoryDeal,
  type Mt5Profile,
  type MarketTick,
  ApiError,
  toErrorMessage,
} from '../api';

export interface TradingDataContextType {
  profile: Mt5Profile | null;
  positions: Mt5Position[];
  orders: Mt5Order[];
  history: Mt5HistoryDeal[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  closePosition: (ticket: number, volume?: number, symbol?: string) => Promise<void>;
  cancelPendingOrder: (ticket: number) => Promise<void>;
}

const TradingDataContext = createContext<TradingDataContextType | undefined>(undefined);

export const TradingDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Mt5Profile | null>(null);
  const [positions, setPositions] = useState<Mt5Position[]>([]);
  const [orders, setOrders] = useState<Mt5Order[]>([]);
  const [history, setHistory] = useState<Mt5HistoryDeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSymbolsRef = useRef<string[]>([]);

  const fetchTradingData = useCallback(async () => {
    if (!mt5Session.isAuthenticated()) {
      setProfile(null);
      setPositions([]);
      setOrders([]);
      setHistory([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [nextProfile, nextPositions, nextOrders, nextHistory] = await Promise.all([
        mt5TradingService.getProfile().catch(() => null),
        mt5TradingService.getPositions().catch(() => []),
        mt5TradingService.getOrders().catch(() => []),
        mt5TradingService.getHistory().catch(() => []),
      ]);

      if (nextProfile) setProfile(nextProfile);
      setPositions(nextPositions);
      setOrders(nextOrders);
      setHistory(nextHistory);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.kind === 'cancelled') return;
      setError(toErrorMessage(err, 'Failed to load trading data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // When MT5 token changes (account switched or logged in), reload everything!
  useEffect(() => {
    fetchTradingData();
    const unsub = mt5Session.subscribe(() => {
      fetchTradingData();
    });
    return () => unsub();
  }, [fetchTradingData]);

  // Connect Market Socket for live price ticks on open positions
  useEffect(() => {
    const symbols = Array.from(new Set(positions.map((p) => p.symbol).filter(Boolean)));
    activeSymbolsRef.current = symbols;

    if (symbols.length === 0) {
      marketSocket.disconnect();
      return;
    }

    marketSocket.connect(symbols, {
      onTick: (tick: MarketTick) => {
        setPositions((current) =>
          current.map((pos) => {
            if (marketSymbolsMatch(pos.symbol, tick.symbol)) {
              const currentPrice = pos.type === 'BUY' ? tick.bid : tick.ask;
              if (currentPrice > 0) {
                // Calculate live approximate profit difference
                const priceDiff =
                  pos.type === 'BUY'
                    ? currentPrice - pos.openPrice
                    : pos.openPrice - currentPrice;
                // Keep server profit if reliable, or adjust
                return {
                  ...pos,
                  currentPrice,
                  profit: Number((pos.profit + priceDiff * 0.1).toFixed(2)),
                };
              }
            }
            return pos;
          }),
        );
      },
      onError: (msg) => {
        console.warn('[TradingData] marketSocket error:', msg);
      },
    });

    return () => {
      marketSocket.disconnect();
    };
  }, [positions.map((p) => p.symbol).sort().join(',')]);

  // Periodic background refresh every 15 seconds
  useEffect(() => {
    if (!mt5Session.isAuthenticated()) return;
    const interval = setInterval(() => {
      fetchTradingData();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchTradingData]);

  const closePosition = useCallback(
    async (ticket: number, volume?: number, symbol?: string) => {
      await mt5TradingService.closePosition({ ticket, volume, symbol });
      await fetchTradingData();
    },
    [fetchTradingData],
  );

  const cancelPendingOrder = useCallback(
    async (ticket: number) => {
      await mt5TradingService.cancelOrder(ticket);
      await fetchTradingData();
    },
    [fetchTradingData],
  );

  const value = useMemo<TradingDataContextType>(
    () => ({
      profile,
      positions,
      orders,
      history,
      isLoading,
      error,
      refresh: fetchTradingData,
      closePosition,
      cancelPendingOrder,
    }),
    [profile, positions, orders, history, isLoading, error, fetchTradingData, closePosition, cancelPendingOrder],
  );

  return <TradingDataContext.Provider value={value}>{children}</TradingDataContext.Provider>;
};

export const useTradingData = (): TradingDataContextType => {
  const context = useContext(TradingDataContext);
  if (!context) {
    throw new Error('useTradingData must be used within a TradingDataProvider');
  }
  return context;
};
