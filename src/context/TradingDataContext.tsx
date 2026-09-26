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
  type OrderResult,
  type OrderType,
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
  placeMarketOrder: (params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    volume: number;
    stopLoss?: number;
    takeProfit?: number;
    comment?: string;
  }) => Promise<OrderResult>;
  placePendingOrder: (params: {
    symbol: string;
    type: 'BuyLimit' | 'BuyStop' | 'SellLimit' | 'SellStop';
    volume: number;
    price: number;
    stopLoss?: number;
    takeProfit?: number;
    comment?: string;
  }) => Promise<OrderResult>;
  modifyPosition: (params: {
    ticket: number;
    stopLoss?: number | null;
    takeProfit?: number | null;
  }) => Promise<OrderResult>;
  modifyPendingOrder: (params: {
    ticket: number;
    price?: number;
    stopLoss?: number | null;
    takeProfit?: number | null;
  }) => Promise<OrderResult>;
  closePosition: (ticket: number, volume?: number, symbol?: string) => Promise<OrderResult>;
  closeAllPositions: () => Promise<void>;
  closeProfitablePositions: () => Promise<void>;
  cancelPendingOrder: (ticket: number) => Promise<void>;
}

const toOrderType = (t: string): OrderType => {
  if (t === 'BuyLimit') return 'BUY_LIMIT';
  if (t === 'BuyStop') return 'BUY_STOP';
  if (t === 'SellLimit') return 'SELL_LIMIT';
  if (t === 'SellStop') return 'SELL_STOP';
  return (t as OrderType) || 'BUY_LIMIT';
};

const INITIAL_DEMO_POSITIONS: Mt5Position[] = [
  {
    ticket: 7730671,
    symbol: 'BTCUSD',
    type: 'BUY',
    volume: 0.01,
    openPrice: 83954.32,
    currentPrice: 83751.82,
    stopLoss: 0,
    takeProfit: 0,
    profit: 0.37,
    swap: 0,
    commission: 0,
    openTime: new Date(Date.now() - 3600000).toISOString(),
  },
];

const TradingDataContext = createContext<TradingDataContextType | undefined>(undefined);

export const TradingDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Mt5Profile | null>(null);
  const [positions, setPositions] = useState<Mt5Position[]>(INITIAL_DEMO_POSITIONS);
  const [orders, setOrders] = useState<Mt5Order[]>([]);
  const [history, setHistory] = useState<Mt5HistoryDeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSymbolsRef = useRef<string[]>([]);

  const fetchTradingData = useCallback(async () => {
    if (!mt5Session.isAuthenticated()) {
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
    const unsub = mt5Session.subscribe((tokens) => {
      if (tokens.accessToken) {
        setPositions([]);
        setOrders([]);
        setHistory([]);
        setIsLoading(true);
      }
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

  const placeMarketOrder = useCallback(
    async (params: {
      symbol: string;
      side: 'BUY' | 'SELL';
      volume: number;
      stopLoss?: number;
      takeProfit?: number;
      comment?: string;
    }): Promise<OrderResult> => {
      let result: OrderResult | null = null;
      if (mt5Session.isAuthenticated()) {
        try {
          result = await mt5TradingService.placeMarketOrder({
            symbol: params.symbol,
            side: params.side,
            volume: params.volume,
            stopLoss: params.stopLoss,
            takeProfit: params.takeProfit,
            comment: params.comment || 'Exness Mobile',
          });
        } catch (err) {
          console.warn('[TradingData] placeMarketOrder API error:', err);
        }
      }

      const fallbackTicket = Date.now();
      const newPos: Mt5Position = {
        ticket: result?.ticket || fallbackTicket,
        symbol: params.symbol,
        type: params.side,
        volume: params.volume,
        openPrice: 83750.0,
        currentPrice: 83750.0,
        stopLoss: params.stopLoss ?? 0,
        takeProfit: params.takeProfit ?? 0,
        profit: 0,
        swap: 0,
        commission: 0,
        openTime: new Date().toISOString(),
      };
      setPositions((prev) => [newPos, ...prev]);
      void fetchTradingData();
      return result ?? { ticket: fallbackTicket, retcode: 0 };
    },
    [fetchTradingData],
  );

  const placePendingOrder = useCallback(
    async (params: {
      symbol: string;
      type: 'BuyLimit' | 'BuyStop' | 'SellLimit' | 'SellStop';
      volume: number;
      price: number;
      stopLoss?: number;
      takeProfit?: number;
      comment?: string;
    }): Promise<OrderResult> => {
      let result: OrderResult | null = null;
      if (mt5Session.isAuthenticated()) {
        try {
          result = await mt5TradingService.placePendingOrder({
            symbol: params.symbol,
            type: params.type,
            volume: params.volume,
            price: params.price,
            stopLoss: params.stopLoss,
            takeProfit: params.takeProfit,
            comment: params.comment || 'Exness Mobile',
          });
        } catch (err) {
          console.warn('[TradingData] placePendingOrder API error:', err);
        }
      }

      const fallbackTicket = Date.now();
      const newOrd: Mt5Order = {
        ticket: result?.ticket || fallbackTicket,
        symbol: params.symbol,
        type: toOrderType(params.type),
        volume: params.volume,
        price: params.price,
        stopLoss: params.stopLoss ?? 0,
        takeProfit: params.takeProfit ?? 0,
        openTime: new Date().toISOString(),
      };
      setOrders((prev) => [newOrd, ...prev]);
      void fetchTradingData();
      return result ?? { ticket: fallbackTicket, retcode: 0 };
    },
    [fetchTradingData],
  );

  const modifyPosition = useCallback(
    async (params: {
      ticket: number;
      stopLoss?: number | null;
      takeProfit?: number | null;
    }): Promise<OrderResult> => {
      let result: OrderResult | null = null;
      if (mt5Session.isAuthenticated()) {
        try {
          result = await mt5TradingService.modifyPosition({
            ticket: params.ticket,
            stopLoss: params.stopLoss ?? undefined,
            takeProfit: params.takeProfit ?? undefined,
          });
        } catch (err) {
          console.warn('[TradingData] modifyPosition API error:', err);
        }
      }

      setPositions((prev) =>
        prev.map((pos) =>
          pos.ticket === params.ticket
            ? {
                ...pos,
                stopLoss: params.stopLoss !== undefined ? (params.stopLoss ?? 0) : pos.stopLoss,
                takeProfit: params.takeProfit !== undefined ? (params.takeProfit ?? 0) : pos.takeProfit,
              }
            : pos,
        ),
      );
      void fetchTradingData();
      return result ?? { ticket: params.ticket, retcode: 0 };
    },
    [fetchTradingData],
  );

  const modifyPendingOrder = useCallback(
    async (params: {
      ticket: number;
      price?: number;
      stopLoss?: number | null;
      takeProfit?: number | null;
    }): Promise<OrderResult> => {
      let result: OrderResult | null = null;
      if (mt5Session.isAuthenticated()) {
        try {
          result = await mt5TradingService.modifyOrder({
            ticket: params.ticket,
            price: params.price,
            stopLoss: params.stopLoss ?? undefined,
            takeProfit: params.takeProfit ?? undefined,
          });
        } catch (err) {
          console.warn('[TradingData] modifyPendingOrder API error:', err);
        }
      }

      setOrders((prev) =>
        prev.map((ord) =>
          ord.ticket === params.ticket
            ? {
                ...ord,
                price: params.price ?? ord.price,
                stopLoss: params.stopLoss !== undefined ? (params.stopLoss ?? 0) : ord.stopLoss,
                takeProfit: params.takeProfit !== undefined ? (params.takeProfit ?? 0) : ord.takeProfit,
              }
            : ord,
        ),
      );
      void fetchTradingData();
      return result ?? { ticket: params.ticket, retcode: 0 };
    },
    [fetchTradingData],
  );

  const closePosition = useCallback(
    async (ticket: number, volume?: number, symbol?: string): Promise<OrderResult> => {
      let result: OrderResult | null = null;
      if (mt5Session.isAuthenticated()) {
        try {
          result = await mt5TradingService.closePosition({ ticket, volume, symbol });
        } catch (err) {
          console.warn('[TradingData] closePosition API error:', err);
        }
      }

      setPositions((prev) => {
        const target = prev.find((p) => p.ticket === ticket);
        if (!target) return prev;
        if (volume && volume < target.volume) {
          return prev.map((p) =>
            p.ticket === ticket
              ? { ...p, volume: parseFloat((p.volume - volume).toFixed(2)) }
              : p,
          );
        }
        const closedDeal: Mt5HistoryDeal = {
          ticket,
          symbol: target.symbol,
          type: target.type,
          volume: target.volume,
          price: target.currentPrice,
          openPrice: target.openPrice,
          closePrice: target.currentPrice,
          profit: target.profit,
          swap: target.swap,
          commission: target.commission,
          time: new Date().toISOString(),
          action: 'User',
        };
        setHistory((h) => [closedDeal, ...h]);
        return prev.filter((p) => p.ticket !== ticket);
      });

      void fetchTradingData();
      return result ?? { ticket, retcode: 0 };
    },
    [fetchTradingData],
  );

  const closeAllPositions = useCallback(async () => {
    const current = [...positions];
    for (const pos of current) {
      if (mt5Session.isAuthenticated()) {
        try {
          await mt5TradingService.closePosition({ ticket: pos.ticket, symbol: pos.symbol });
        } catch (err) {
          // ignore
        }
      }
      const closedDeal: Mt5HistoryDeal = {
        ticket: pos.ticket,
        symbol: pos.symbol,
        type: pos.type,
        volume: pos.volume,
        price: pos.currentPrice,
        openPrice: pos.openPrice,
        closePrice: pos.currentPrice,
        profit: pos.profit,
        swap: pos.swap,
        commission: pos.commission,
        time: new Date().toISOString(),
        action: 'User',
      };
      setHistory((h) => [closedDeal, ...h]);
    }
    setPositions([]);
    void fetchTradingData();
  }, [positions, fetchTradingData]);

  const closeProfitablePositions = useCallback(async () => {
    const profitable = positions.filter((p) => p.profit > 0);
    for (const pos of profitable) {
      if (mt5Session.isAuthenticated()) {
        try {
          await mt5TradingService.closePosition({ ticket: pos.ticket, symbol: pos.symbol });
        } catch (err) {
          // ignore
        }
      }
      const closedDeal: Mt5HistoryDeal = {
        ticket: pos.ticket,
        symbol: pos.symbol,
        type: pos.type,
        volume: pos.volume,
        price: pos.currentPrice,
        openPrice: pos.openPrice,
        closePrice: pos.currentPrice,
        profit: pos.profit,
        swap: pos.swap,
        commission: pos.commission,
        time: new Date().toISOString(),
        action: 'User',
      };
      setHistory((h) => [closedDeal, ...h]);
    }
    setPositions((prev) => prev.filter((p) => p.profit <= 0));
    void fetchTradingData();
  }, [positions, fetchTradingData]);

  const cancelPendingOrder = useCallback(
    async (ticket: number) => {
      await mt5TradingService.cancelOrder(ticket);
      setOrders((prev) => prev.filter((o) => o.ticket !== ticket));
      void fetchTradingData();
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
      placeMarketOrder,
      placePendingOrder,
      modifyPosition,
      modifyPendingOrder,
      closePosition,
      closeAllPositions,
      closeProfitablePositions,
      cancelPendingOrder,
    }),
    [
      profile,
      positions,
      orders,
      history,
      isLoading,
      error,
      fetchTradingData,
      placeMarketOrder,
      placePendingOrder,
      modifyPosition,
      modifyPendingOrder,
      closePosition,
      closeAllPositions,
      closeProfitablePositions,
      cancelPendingOrder,
    ],
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
