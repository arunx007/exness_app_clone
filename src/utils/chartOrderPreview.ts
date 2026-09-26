import type { OrderSide, OrderType } from '../api';

export type ChartOrderMode = 'market' | 'pending';

export type ChartPreviewSide = OrderSide;

export type ChartPreviewKind = 'limit' | 'stop';

export type Mt5PendingType = Extract<
  OrderType,
  'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP'
>;

/** Payload for WebView `SET_ORDER_PREVIEW` (TradingView Broker synthetic line). */
export type ChartOrderPreviewPayload = {
  symbol: string;
  side: 'Buy' | 'Sell';
  type: ChartPreviewKind;
  volume: number;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
};

export type ChartOrderPreviewChange = {
  source: 'chart' | 'chart_cancel';
  price?: number;
  side?: 'Buy' | 'Sell';
  type?: ChartPreviewKind;
  stopLoss?: number;
  takeProfit?: number;
};

export type ChartPreviewState = {
  side: ChartPreviewSide;
  price: number;
  kind: ChartPreviewKind;
  stopLoss?: number;
  takeProfit?: number;
};

/** i18n keys under `chart.*` or `trade.*` for placement failures. */
export type ChartPendingErrorKey =
  | 'chart.pendingNeedsQuote'
  | 'chart.pendingNeedsPreview'
  | 'trade.invalidVolume'
  | 'trade.invalidPrice'
  | 'trade.pendingPriceHint'
  | 'trade.buyLevelHint'
  | 'trade.sellLevelHint';

export type ChartPendingPlacement =
  | {
      ok: true;
      side: ChartPreviewSide;
      kind: ChartPreviewKind;
      type: Mt5PendingType;
      price: number;
      volume: number;
      stopLoss?: number;
      takeProfit?: number;
    }
  | { ok: false; errorKey: ChartPendingErrorKey };

/**
 * Auto Limit vs Stop from price vs live market.
 * BUY uses ask; SELL uses bid (same as Solitaire / NewOrderSheet).
 */
export function inferChartPendingKind(
  side: ChartPreviewSide,
  price: number,
  marketPrice: number,
): ChartPreviewKind {
  if (!Number.isFinite(marketPrice) || marketPrice <= 0) return 'limit';
  if (side === 'BUY') return price < marketPrice ? 'limit' : 'stop';
  return price > marketPrice ? 'limit' : 'stop';
}

export function marketPriceForSide(side: ChartPreviewSide, bid: number, ask: number): number {
  return side === 'BUY' ? ask : bid;
}

export function resolveMt5PendingType(
  side: ChartPreviewSide,
  kind: ChartPreviewKind,
): Mt5PendingType {
  if (side === 'BUY') return kind === 'limit' ? 'BUY_LIMIT' : 'BUY_STOP';
  return kind === 'limit' ? 'SELL_LIMIT' : 'SELL_STOP';
}

export function toTvPreviewSide(side: ChartPreviewSide): 'Buy' | 'Sell' {
  return side === 'BUY' ? 'Buy' : 'Sell';
}

export function fromTvPreviewSide(side: 'Buy' | 'Sell' | undefined): ChartPreviewSide {
  return side === 'Sell' ? 'SELL' : 'BUY';
}

/** Same strict inequalities as NewOrderSheet pending validation. */
export function validateChartPendingPrice(
  side: ChartPreviewSide,
  kind: ChartPreviewKind,
  price: number,
  marketPrice: number,
): ChartPendingErrorKey | null {
  if (!Number.isFinite(price) || price <= 0) return 'trade.invalidPrice';
  if (!Number.isFinite(marketPrice) || marketPrice <= 0) return 'chart.pendingNeedsQuote';

  const valid =
    side === 'BUY'
      ? kind === 'limit'
        ? price < marketPrice
        : price > marketPrice
      : kind === 'limit'
        ? price > marketPrice
        : price < marketPrice;

  return valid ? null : 'trade.pendingPriceHint';
}

export function validateChartVolume(volume: number): ChartPendingErrorKey | null {
  if (
    !Number.isFinite(volume) ||
    volume <= 0 ||
    Math.round(volume * 100) <= 0 ||
    Math.abs(Math.round(volume * 100) - volume * 100) > 1e-8
  ) {
    return 'trade.invalidVolume';
  }
  return null;
}

/** SL/TP relative to pending open price (same rules as NewOrderSheet). */
export function validateChartPendingLevels(
  side: ChartPreviewSide,
  openPrice: number,
  stopLoss?: number,
  takeProfit?: number,
): ChartPendingErrorKey | null {
  const sl = stopLoss !== undefined && stopLoss > 0 ? stopLoss : undefined;
  const tp = takeProfit !== undefined && takeProfit > 0 ? takeProfit : undefined;
  if (sl !== undefined && (side === 'BUY' ? sl >= openPrice : sl <= openPrice)) {
    return side === 'BUY' ? 'trade.buyLevelHint' : 'trade.sellLevelHint';
  }
  if (tp !== undefined && (side === 'BUY' ? tp <= openPrice : tp >= openPrice)) {
    return side === 'BUY' ? 'trade.buyLevelHint' : 'trade.sellLevelHint';
  }
  return null;
}

/**
 * Full pending placement resolve for chart Buy/Sell after pending mode is on.
 * Buy → BuyLimit / BuyStop; Sell → SellLimit / SellStop (auto from price vs ask/bid).
 */
export function resolveChartPendingPlacement(input: {
  side: ChartPreviewSide;
  price: number | undefined | null;
  bid: number;
  ask: number;
  volume: number;
  stopLoss?: number;
  takeProfit?: number;
}): ChartPendingPlacement {
  const volumeError = validateChartVolume(input.volume);
  if (volumeError) return { ok: false, errorKey: volumeError };

  const bid = Number(input.bid);
  const ask = Number(input.ask);
  if (!(bid > 0) || !(ask > 0)) {
    return { ok: false, errorKey: 'chart.pendingNeedsQuote' };
  }

  const price = Number(input.price);
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, errorKey: 'chart.pendingNeedsPreview' };
  }

  const market = marketPriceForSide(input.side, bid, ask);
  const kind = inferChartPendingKind(input.side, price, market);
  const priceError = validateChartPendingPrice(input.side, kind, price, market);
  if (priceError) return { ok: false, errorKey: priceError };

  const levelsError = validateChartPendingLevels(
    input.side,
    price,
    input.stopLoss,
    input.takeProfit,
  );
  if (levelsError) return { ok: false, errorKey: levelsError };

  const stopLoss =
    input.stopLoss !== undefined && input.stopLoss > 0 ? input.stopLoss : undefined;
  const takeProfit =
    input.takeProfit !== undefined && input.takeProfit > 0 ? input.takeProfit : undefined;

  return {
    ok: true,
    side: input.side,
    kind,
    type: resolveMt5PendingType(input.side, kind),
    price,
    volume: input.volume,
    ...(stopLoss !== undefined ? { stopLoss } : {}),
    ...(takeProfit !== undefined ? { takeProfit } : {}),
  };
}

export function buildChartPreviewPayload(
  symbol: string,
  side: ChartPreviewSide,
  price: number,
  kind: ChartPreviewKind,
  volume: number,
  stopLoss?: number,
  takeProfit?: number,
): ChartOrderPreviewPayload {
  return {
    symbol,
    side: toTvPreviewSide(side),
    type: kind,
    volume,
    price,
    ...(stopLoss !== undefined && stopLoss > 0 ? { stopLoss } : {}),
    ...(takeProfit !== undefined && takeProfit > 0 ? { takeProfit } : {}),
  };
}

/** Caption for trade bar: "Buy Limit", "Sell Stop", etc. */
export function chartPendingActionLabelKey(
  side: ChartPreviewSide,
  kind: ChartPreviewKind,
): 'chart.buyLimit' | 'chart.buyStop' | 'chart.sellLimit' | 'chart.sellStop' {
  if (side === 'BUY') return kind === 'limit' ? 'chart.buyLimit' : 'chart.buyStop';
  return kind === 'limit' ? 'chart.sellLimit' : 'chart.sellStop';
}
