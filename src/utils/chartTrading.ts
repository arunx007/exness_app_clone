import type { Mt5Order, Mt5Position } from '../api';
import { marketSymbolsMatch } from './symbol';

function chartOwnsSymbol(entitySymbol: string, chartSymbol: string): boolean {
  const left = entitySymbol.trim().toUpperCase();
  const right = chartSymbol.trim().toUpperCase();
  if (left === right) return true;
  // Allow only known broker-suffix variants of the same instrument.
  return marketSymbolsMatch(left, right);
}

export type ChartTradingPosition = {
  ticket: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  lots: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  stopLoss: number;
  takeProfit: number;
};

export type ChartTradingOrder = {
  ticket: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: 'LIMIT' | 'STOP';
  lots: number;
  price: number;
  stopLoss: number;
  takeProfit: number;
};

export type ChartTradingSync = {
  positions: ChartTradingPosition[];
  orders: ChartTradingOrder[];
};

function activeOrder(order: Mt5Order): boolean {
  const state = String(order.state ?? '').toLowerCase();
  return !(
    state.includes('filled') ||
    state.includes('cancel') ||
    state.includes('reject') ||
    state.includes('expire')
  );
}

/** Pending chart lines — anything that is not a plain market BUY/SELL fill. */
function isPendingChartOrder(order: Mt5Order): boolean {
  if (!activeOrder(order)) return false;
  const isPendingType =
    order.type.includes('LIMIT') ||
    order.type.includes('STOP') ||
    (order.type !== 'BUY' && order.type !== 'SELL');
  if (!isPendingType) return false;
  // Entry can be 0 from some brokers — still show SL/TP lines when present.
  return (
    order.price > 0 ||
    (order.stopLoss ?? 0) > 0 ||
    (order.takeProfit ?? 0) > 0
  );
}

export function toChartTradingSync(
  positions: Mt5Position[],
  orders: Mt5Order[],
  chartSymbol: string,
): ChartTradingSync {
  return {
    positions: positions
      .filter((position) => chartOwnsSymbol(position.symbol, chartSymbol))
      .map((position) => ({
        ticket: position.ticket,
        symbol: position.symbol,
        side: position.type,
        lots: position.volume,
        openPrice: position.openPrice,
        currentPrice: position.currentPrice,
        profit: position.profit,
        stopLoss: position.stopLoss && position.stopLoss > 0 ? position.stopLoss : 0,
        takeProfit: position.takeProfit && position.takeProfit > 0 ? position.takeProfit : 0,
      })),
    orders: orders
      .filter((order) => isPendingChartOrder(order) && chartOwnsSymbol(order.symbol, chartSymbol))
      .map((order) => ({
        ticket: order.ticket,
        symbol: order.symbol,
        side: order.type.startsWith('SELL') ? 'SELL' : 'BUY',
        orderType: order.type.includes('LIMIT') ? 'LIMIT' : 'STOP',
        lots: order.volume,
        price: order.price,
        stopLoss: order.stopLoss && order.stopLoss > 0 ? order.stopLoss : 0,
        takeProfit: order.takeProfit && order.takeProfit > 0 ? order.takeProfit : 0,
      })),
  };
}
