import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import {
  chartSocket,
  type ChartCandle,
  type ChartQuote,
  type ChartSocketStatus,
  socketTimeframeToMs,
  resolutionToSocketTimeframe,
} from '../../api';
import { useTradingData } from '../../context/TradingDataContext';
import { toChartTradingSync } from '../../utils/chartTrading';
import {
  getTradingViewChartUri,
  TRADINGVIEW_WEBVIEW_PROPS,
} from './getTradingViewChartUri';
import { normalizeMarketSymbol, marketSymbolsMatch } from '../../utils/symbol';
import { DEFAULT_CATALOG_SYMBOLS } from '../../constants/symbolsCatalog';
import { useTheme } from '../../theme';

const DEFAULT_RESOLUTION = '5';

export interface TradingViewChartProps {
  symbol: string;
  resolution?: string;
  onResolutionChange?: (res: string) => void;
  onLiveQuote?: (quote: { bid: number; ask: number }) => void;
  previewOrder?: {
    side: 'Buy' | 'Sell';
    price: number;
    lots: number;
    stopLoss?: number;
    takeProfit?: number;
    type?: 'limit' | 'stop';
  } | null;
  onPreviewChange?: (change: { price: number; stopLoss?: number; takeProfit?: number }) => void;
  containerStyle?: object;
  initialPrice?: number;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  resolution = DEFAULT_RESOLUTION,
  onResolutionChange,
  onLiveQuote,
  previewOrder,
  onPreviewChange,
  containerStyle,
  initialPrice,
}) => {
  const {
    positions,
    orders,
    modifyPosition,
    modifyPendingOrder,
    closePosition,
    cancelPendingOrder,
    refresh: refreshTrading,
  } = useTradingData();

  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const pageActiveRef = useRef(false);
  const pendingHistoryRef = useRef<{ candles: ChartCandle[]; resolution: string } | null>(null);
  const resolutionRef = useRef(resolution);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [socketStatus, setSocketStatus] = useState<ChartSocketStatus>('disconnected');

  const onLiveQuoteRef = useRef(onLiveQuote);
  useEffect(() => {
    onLiveQuoteRef.current = onLiveQuote;
  });

  const lastLivePriceRef = useRef<number>(initialPrice || 0);

  const tradingSymbol = symbol ? symbol.trim() : 'BTCUSD';
  const chartSymbol = normalizeMarketSymbol(tradingSymbol);

  useEffect(() => {
    resolutionRef.current = resolution;
  }, [resolution]);

  const initialResolutionRef = useRef(resolution);

  const { isDark } = useTheme();

  // Construct chart URL (uses initial resolution so switching timeframe never forces a full reload)
  const chartUri = useMemo(
    () =>
      getTradingViewChartUri({
        symbol: chartSymbol,
        tradingSymbol,
        interval: initialResolutionRef.current,
        theme: isDark ? 'dark' : 'light',
        background: isDark ? '#0B0E14' : '#FFFFFF',
        serverTimeOffset: chartSocket.getBrokerOffsetMs(),
      }),
    [chartSymbol, tradingSymbol, isDark],
  );

  // Synchronize open positions and pending orders for broker lines
  const tradingSync = useMemo(() => {
    const sync = toChartTradingSync(positions, orders, tradingSymbol);
    return {
      positions: sync.positions.map((p) => ({
        id: String(p.ticket),
        symbol: p.symbol,
        side: p.side,
        lots: p.lots,
        openPrice: p.openPrice,
        currentPrice: p.currentPrice,
        profit: p.profit,
        stopLoss: p.stopLoss,
        takeProfit: p.takeProfit,
      })),
      orders: sync.orders.map((o) => ({
        id: String(o.ticket),
        symbol: o.symbol,
        side: o.side,
        orderType: o.orderType,
        lots: o.lots,
        price: o.price,
        stopLoss: o.stopLoss,
        takeProfit: o.takeProfit,
      })),
    };
  }, [positions, orders, tradingSymbol]);

  const injectBridgeCall = useCallback((expression: string) => {
    webRef.current?.injectJavaScript(
      `(function(){try{${expression}}catch(e){console.warn('Bridge inject error:', e);}})();true;`,
    );
  }, []);

  const deliverToWebView = useCallback(
    (json: string) => {
      injectBridgeCall(
        `window.__handleNativeChartMessage&&window.__handleNativeChartMessage(${JSON.stringify(json)});`,
      );
    },
    [injectBridgeCall],
  );

  const pushTradingSync = useCallback(() => {
    if (!readyRef.current) return;
    deliverToWebView(
      JSON.stringify({
        type: 'trading_sync',
        payload: tradingSync,
      }),
    );
  }, [deliverToWebView, tradingSync]);

  const toTvBars = useCallback((candles: ChartCandle[]) => {
    return candles.map((candle) => ({
      ...candle,
      time: candle.time < 1_000_000_000_000 ? candle.time * 1000 : candle.time,
    }));
  }, []);

  const pushHistory = useCallback(
    (candles: ChartCandle[], res: string) => {
      if (!candles.length) return;
      const bars = toTvBars(candles);
      const offsetMs = chartSocket.getBrokerOffsetMs();
      injectBridgeCall(
        `window.__chartBridge&&window.__chartBridge.applyHistory(${JSON.stringify(chartSymbol)},${JSON.stringify(res)},${JSON.stringify(bars)},${offsetMs});`,
      );
      deliverToWebView(
        JSON.stringify({
          type: 'history',
          payload: {
            symbol: chartSymbol,
            resolution: res,
            candles: bars,
            serverTimeOffset: offsetMs,
          },
        }),
      );
    },
    [chartSymbol, deliverToWebView, injectBridgeCall, toTvBars],
  );

  const pushUpdate = useCallback(
    (candle: ChartCandle, res: string) => {
      const bar = toTvBars([candle])[0];
      const offsetMs = chartSocket.getBrokerOffsetMs();
      injectBridgeCall(
        `window.__chartBridge&&window.__chartBridge.applyUpdate(${JSON.stringify(chartSymbol)},${JSON.stringify(res)},${JSON.stringify(bar)},${offsetMs});`,
      );
      deliverToWebView(
        JSON.stringify({
          type: 'update',
          payload: {
            symbol: chartSymbol,
            resolution: res,
            candle: bar,
            serverTimeOffset: offsetMs,
          },
        }),
      );
    },
    [chartSymbol, deliverToWebView, injectBridgeCall, toTvBars],
  );

  const pushQuote = useCallback(
    (quote: ChartQuote) => {
      if (quote.bid > 0) {
        lastLivePriceRef.current = quote.bid;
      }
      onLiveQuoteRef.current?.({ bid: quote.bid, ask: quote.ask });
      injectBridgeCall(
        `window.__lastChartQuote=${JSON.stringify({
          bid: quote.bid,
          ask: quote.ask,
        })};window.__chartBridge&&window.__chartBridge.applyQuote(${JSON.stringify({
          symbol: chartSymbol,
          bid: quote.bid,
          ask: quote.ask,
          time: quote.time,
          lastValidBid: quote.bid > 0 ? quote.bid : undefined,
          lastValidAsk: quote.ask > 0 ? quote.ask : undefined,
        })});`,
      );
    },
    [chartSymbol, injectBridgeCall],
  );

  const requestHistory = useCallback(
    (targetResolution: string) => {
      // Connect to live broker socket for real MT5 candles and live ticks
      chartSocket.connect(tradingSymbol, targetResolution, {
        onHistory: (candles) => {
          if (candles && candles.length > 0) {
            if (pageActiveRef.current) {
              pushHistory(candles, targetResolution);
            } else {
              pendingHistoryRef.current = { candles, resolution: targetResolution };
            }
          }
        },
        onCandle: (candle) => {
          if (pageActiveRef.current) pushUpdate(candle, resolutionRef.current);
        },
        onQuote: (quote) => {
          if (pageActiveRef.current) pushQuote(quote);
        },
        onStatusChange: setSocketStatus,
        onError: () => {
          setSocketStatus((curr) => (curr === 'connected' ? 'disconnected' : curr));
        },
      });
    },
    [pushHistory, pushQuote, pushUpdate, tradingSymbol],
  );

  useEffect(() => {
    if (readyRef.current) {
      pushTradingSync();
    }
  }, [pushTradingSync]);

  useEffect(() => {
    readyRef.current = false;
    pageActiveRef.current = false;
    pendingHistoryRef.current = null;
    requestHistory(resolutionRef.current);
    return () => chartSocket.disconnect();
  }, [requestHistory, tradingSymbol]);

  // Handle external resolution changes (e.g. from React Native UI)
  useEffect(() => {
    if (readyRef.current && resolutionRef.current !== resolution) {
      resolutionRef.current = resolution;
      injectBridgeCall(
        `(function(){
          try {
            var tv = window.tvWidget;
            var c = tv && tv.activeChart && tv.activeChart();
            if (c && typeof c.setResolution === 'function' && c.resolution() !== ${JSON.stringify(resolution)}) {
              c.setResolution(${JSON.stringify(resolution)});
            }
          } catch(e){}
        })();`,
      );
      requestHistory(resolution);
    }
  }, [resolution, injectBridgeCall, requestHistory]);

  // Handle external symbol changes (e.g. when user picks ETHUSD, XAUUSD, etc.)
  const lastSymbolRef = useRef(tradingSymbol);
  useEffect(() => {
    if (readyRef.current && lastSymbolRef.current !== tradingSymbol) {
      lastSymbolRef.current = tradingSymbol;
      injectBridgeCall(
        `(function(){
          try {
            var tv = window.tvWidget;
            var c = tv && tv.activeChart && tv.activeChart();
            if (c && typeof c.setSymbol === 'function') {
              c.setSymbol(${JSON.stringify(chartSymbol)});
            }
          } catch(e){}
        })();`,
      );
      requestHistory(resolutionRef.current);
    }
  }, [chartSymbol, injectBridgeCall, requestHistory, tradingSymbol]);

  // Reply back to WebView bridge
  const reply = useCallback(
    (type: string, requestId: string | undefined, success: boolean, error?: string) => {
      if (!requestId) return;
      deliverToWebView(
        JSON.stringify({
          type,
          payload: { requestId, success, ...(error ? { error } : null) },
        }),
      );
    },
    [deliverToWebView],
  );

  // Sync order preview (e.g. pending line preview)
  useEffect(() => {
    if (!readyRef.current) return;
    if (previewOrder) {
      deliverToWebView(
        JSON.stringify({
          type: 'SET_ORDER_PREVIEW',
          payload: {
            symbol: tradingSymbol,
            side: previewOrder.side,
            type: previewOrder.type || 'limit',
            volume: previewOrder.lots,
            price: previewOrder.price,
            stopLoss: previewOrder.stopLoss,
            takeProfit: previewOrder.takeProfit,
          },
        }),
      );
    } else {
      deliverToWebView(
        JSON.stringify({
          type: 'SET_ORDER_PREVIEW',
          payload: null,
        }),
      );
    }
  }, [deliverToWebView, previewOrder, tradingSymbol]);

  const onMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      let message: any;
      try {
        message = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      if (message.type === 'DEBUG_SLTP' || message.type === 'DEBUG_PREVIEW') {
        return;
      }

      if (!pageActiveRef.current) {
        pageActiveRef.current = true;
        if (pendingHistoryRef.current?.candles?.length) {
          pushHistory(
            pendingHistoryRef.current.candles,
            pendingHistoryRef.current.resolution,
          );
          pendingHistoryRef.current = null;
        }
      }

      if (message.type === 'READY') {
        const nextResolution = message.payload?.resolution || resolutionRef.current;
        resolutionRef.current = nextResolution;
        readyRef.current = true;
        setLoading(false);
        setFailed(false);

        // Apply Exness white background & candle overrides
        const bg = '#FFFFFF';
        injectBridgeCall(
          `(function(){
            var bg=${JSON.stringify(bg)};
            document.documentElement.style.background=bg;
            document.body.style.background=bg;
            try{
              var tv=window.tvWidget;
              var c=tv&&tv.activeChart&&tv.activeChart();
              var o={
                'paneProperties.background':bg,
                'paneProperties.backgroundType':'solid',
                'scalesProperties.backgroundColor':bg,
                'mainSeriesProperties.candleStyle.upColor':'#1E88E5',
                'mainSeriesProperties.candleStyle.downColor':'#EF4444',
                'mainSeriesProperties.candleStyle.borderUpColor':'#1E88E5',
                'mainSeriesProperties.candleStyle.borderDownColor':'#EF4444',
                'mainSeriesProperties.candleStyle.wickUpColor':'#1E88E5',
                'mainSeriesProperties.candleStyle.wickDownColor':'#EF4444',
                'paneProperties.vertGridProperties.color':'#F3F4F6',
                'paneProperties.horzGridProperties.color':'#F3F4F6'
              };
              if(c&&c.applyOverrides)c.applyOverrides(o);
              if(tv&&tv.applyOverrides)tv.applyOverrides(o);
            }catch(e){}
            if(window.__chartBridge&&window.__chartBridge.applyBackground)window.__chartBridge.applyBackground(bg);
          })();`,
        );

        if (pendingHistoryRef.current?.candles.length) {
          pushHistory(
            pendingHistoryRef.current.candles,
            pendingHistoryRef.current.resolution,
          );
          pendingHistoryRef.current = null;
        }

        // Push real live quote if already received so TradingView Ask/Bid lines appear at once
        if (lastLivePriceRef.current > 0) {
          const upper = tradingSymbol.toUpperCase();
          const spread = upper.includes('BTC') ? 2.2 : upper.includes('XAU') ? 0.25 : 0.0001;
          pushQuote({
            symbol: tradingSymbol,
            bid: lastLivePriceRef.current,
            ask: lastLivePriceRef.current + spread,
            time: Date.now(),
          });
        }

        pushTradingSync();
        return;
      }

      if (message.type === 'INTERVAL_CHANGED' || message.type === 'REQUEST_HISTORY') {
        const res = message.payload?.resolution || resolutionRef.current || DEFAULT_RESOLUTION;
        resolutionRef.current = res;
        onResolutionChange?.(res);
        requestHistory(res);
        return;
      }

      if (message.type === 'ORDER_PREVIEW_CHANGE') {
        const detail = message.payload;
        if (detail && detail.price > 0) {
          onPreviewChange?.({
            price: detail.price,
            stopLoss: detail.stopLoss,
            takeProfit: detail.takeProfit,
          });
        }
        return;
      }

      // DRAG TO UPDATE POSITION (SL / TP)
      if (message.type === 'MODIFY_POSITION') {
        const { requestId, positionId, stopLoss, takeProfit } = message.payload ?? {};
        const ticket = Number(positionId);
        if (Number.isFinite(ticket) && ticket > 0) {
          try {
            await modifyPosition({
              ticket,
              stopLoss: stopLoss !== undefined ? stopLoss : null,
              takeProfit: takeProfit !== undefined ? takeProfit : null,
            });
            void refreshTrading();
            reply('MODIFY_POSITION_RESULT', requestId, true);
          } catch (e) {
            reply('MODIFY_POSITION_RESULT', requestId, false, 'Failed to modify position');
          }
        }
        return;
      }

      // DRAG TO UPDATE PENDING ORDER (PRICE / SL / TP)
      if (message.type === 'MODIFY_ORDER') {
        const { requestId, orderId, price, stopLoss, takeProfit } = message.payload ?? {};
        const ticket = Number(orderId);
        if (Number.isFinite(ticket) && ticket > 0) {
          try {
            await modifyPendingOrder({
              ticket,
              price: price !== undefined ? price : undefined,
              stopLoss: stopLoss !== undefined ? stopLoss : null,
              takeProfit: takeProfit !== undefined ? takeProfit : null,
            });
            void refreshTrading();
            reply('MODIFY_ORDER_RESULT', requestId, true);
          } catch (e) {
            reply('MODIFY_ORDER_RESULT', requestId, false, 'Failed to modify order');
          }
        }
        return;
      }

      // CLOSE TRADE FROM CHART LINE
      if (message.type === 'CLOSE_POSITION') {
        const { requestId, positionId, lots: closeLots } = message.payload ?? {};
        const ticket = Number(positionId);
        if (Number.isFinite(ticket) && ticket > 0) {
          try {
            await closePosition(ticket, closeLots && closeLots > 0 ? closeLots : undefined, tradingSymbol);
            void refreshTrading();
            reply('CLOSE_POSITION_RESULT', requestId, true);
          } catch (e) {
            reply('CLOSE_POSITION_RESULT', requestId, false, 'Failed to close position');
          }
        }
        return;
      }

      // CANCEL PENDING ORDER FROM CHART LINE
      if (message.type === 'CANCEL_ORDER') {
        const { requestId, orderId } = message.payload ?? {};
        const ticket = Number(orderId);
        if (Number.isFinite(ticket) && ticket > 0) {
          try {
            await cancelPendingOrder(ticket);
            void refreshTrading();
            reply('CANCEL_ORDER_RESULT', requestId, true);
          } catch (e) {
            reply('CANCEL_ORDER_RESULT', requestId, false, 'Failed to cancel order');
          }
        }
        return;
      }
    },
    [
      cancelPendingOrder,
      closePosition,
      injectBridgeCall,
      modifyPendingOrder,
      modifyPosition,
      onPreviewChange,
      onResolutionChange,
      pushHistory,
      pushQuote,
      pushTradingSync,
      refreshTrading,
      reply,
      requestHistory,
      tradingSymbol,
    ],
  );

  return (
    <View style={[styles.container, containerStyle]}>
      <WebView
        ref={webRef}
        source={{ uri: chartUri }}
        {...TRADINGVIEW_WEBVIEW_PROPS}
        onMessage={onMessage}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
        style={styles.webView}
      />

      {loading && !failed && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1E88E5" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
