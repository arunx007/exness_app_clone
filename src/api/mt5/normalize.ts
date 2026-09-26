import type {
  Mt5HistoryDeal,
  Mt5Order,
  Mt5Position,
  Mt5Profile,
  Mt5Symbol,
  OrderSide,
  OrderType,
} from './types';
import { mt5VolumeToLots, resolveMt5Lots } from './volume';

export function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function optionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function optionalPrice(value: unknown): number | undefined {
  const parsed = optionalNumber(value);
  return parsed !== undefined && parsed > 0 ? parsed : undefined;
}

export function stringValue(value: unknown, fallback = ''): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

export function extractRows(payload: unknown, keys: string[] = []): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object');
  }
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;
  const candidates = [
    ...keys,
    'items',
    'data',
    'positions',
    'Positions',
    'orders',
    'Orders',
    'pendingOrders',
    'PendingOrders',
    'result',
    'symbols',
  ];

  for (const key of candidates) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object');
    }
  }

  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
    return extractRows(record.data, keys);
  }

  return [];
}

export function extractObject(
  payload: unknown,
  keys: string[] = [],
): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }

  return record;
}

export function toLots(value: unknown, symbol = ''): number {
  return mt5VolumeToLots(value, symbol);
}

export function lotsFromRow(row: Record<string, unknown>, symbol: string): number {
  return resolveMt5Lots(row, symbol);
}

export function toOrderSide(value: unknown): OrderSide {
  const text = String(value ?? '').toUpperCase();
  if (text.includes('SELL')) return 'SELL';
  if (text.includes('BUY')) return 'BUY';
  return Number(value) === 1 ? 'SELL' : 'BUY';
}

export function toOrderType(value: unknown): OrderType {
  const raw = String(value ?? '').toUpperCase();
  const text = raw.replace(/[\s-]+/g, '_');
  if (
    text === 'BUY' ||
    text === 'SELL' ||
    text === 'BUY_LIMIT' ||
    text === 'SELL_LIMIT' ||
    text === 'BUY_STOP' ||
    text === 'SELL_STOP'
  ) {
    return text;
  }

  if (text === 'BUYLIMIT' || (text.includes('BUY') && text.includes('LIMIT'))) return 'BUY_LIMIT';
  if (text === 'SELLLIMIT' || (text.includes('SELL') && text.includes('LIMIT'))) return 'SELL_LIMIT';
  if (text === 'BUYSTOP' || (text.includes('BUY') && text.includes('STOP'))) return 'BUY_STOP';
  if (text === 'SELLSTOP' || (text.includes('SELL') && text.includes('STOP'))) return 'SELL_STOP';

  const code = Number(value);
  switch (code) {
    case 0:
      return 'BUY';
    case 1:
      return 'SELL';
    case 2:
      return 'BUY_LIMIT';
    case 3:
      return 'SELL_LIMIT';
    case 4:
      return 'BUY_STOP';
    case 5:
      return 'SELL_STOP';
    default:
      return text.includes('SELL') ? 'SELL' : 'BUY';
  }
}

export function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const date = new Date(String(value ?? ''));
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export function entityTicket(row: Record<string, unknown>): number {
  return numberValue(row.ticket ?? row.Ticket ?? row.id ?? row.positionId ?? row.orderId ?? row.dealId);
}

export function normalizeProfile(payload: unknown): Mt5Profile | null {
  const row =
    extractObject(payload, ['data', 'account', 'AccountInfo', 'accountInfo', 'profile', 'Profile']) ??
    (payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null);
  if (!row) return null;

  const login = numberValue(
    row.login ?? row.Login ?? row.clientLogin ?? row.ClientLogin ?? row.mt5Login ?? row.Mt5Login,
  );
  const balance = optionalNumber(row.balance ?? row.Balance);
  const equity = optionalNumber(row.equity ?? row.Equity);
  const freeMargin = optionalNumber(
    row.freeMargin ?? row.FreeMargin ?? row.marginFree ?? row.MarginFree,
  );
  const margin = optionalNumber(row.margin ?? row.Margin);
  const marginLevel = optionalNumber(row.marginLevel ?? row.MarginLevel);
  const profit = optionalNumber(row.profit ?? row.Profit);
  const leverage = optionalNumber(row.leverage ?? row.Leverage);
  const currency = stringValue(row.currency ?? row.Currency, 'USD');

  const hasMetrics =
    balance !== undefined ||
    equity !== undefined ||
    freeMargin !== undefined ||
    margin !== undefined ||
    marginLevel !== undefined ||
    profit !== undefined;

  if (!login && !hasMetrics) return null;

  return {
    login,
    name: stringValue(row.name ?? row.Name) || undefined,
    currency,
    balance: balance ?? 0,
    equity: equity ?? 0,
    margin: margin ?? 0,
    freeMargin: freeMargin ?? 0,
    marginLevel: marginLevel ?? 0,
    leverage: leverage ?? 0,
    credit: optionalNumber(row.credit ?? row.Credit),
    profit,
  };
}

export function mergeProfile(base: Mt5Profile | null, patch: Partial<Mt5Profile>): Mt5Profile {
  return {
    login: patch.login ?? base?.login ?? 0,
    name: patch.name ?? base?.name,
    currency: patch.currency ?? base?.currency ?? 'USD',
    balance: patch.balance ?? base?.balance ?? 0,
    equity: patch.equity ?? base?.equity ?? 0,
    margin: patch.margin ?? base?.margin ?? 0,
    freeMargin: patch.freeMargin ?? base?.freeMargin ?? 0,
    marginLevel: patch.marginLevel ?? base?.marginLevel ?? 0,
    leverage: patch.leverage ?? base?.leverage ?? 0,
    credit: patch.credit ?? base?.credit,
    profit: patch.profit ?? base?.profit,
  };
}

export function normalizePosition(raw: unknown): Mt5Position | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const ticket = entityTicket(row);
  const symbol = stringValue(row.symbol ?? row.Symbol ?? row.instrument);
  if (!ticket || !symbol) return null;

  const volume = lotsFromRow(row, symbol);
  const openPrice = numberValue(
    row.openPrice ?? row.priceOpen ?? row.OpenPrice ?? row.PriceOpen ?? row.open_price,
  );
  const currentPrice = numberValue(
    row.currentPrice ??
      row.priceCurrent ??
      row.PriceCurrent ??
      row.closePrice ??
      row.price ??
      row.Price,
    openPrice,
  );

  return {
    ticket,
    symbol,
    type: toOrderSide(row.type ?? row.Type ?? row.side ?? row.Side ?? row.action ?? row.command),
    volume,
    openPrice,
    currentPrice,
    stopLoss: optionalPrice(row.stopLoss ?? row.StopLoss ?? row.sl ?? row.SL),
    takeProfit: optionalPrice(row.takeProfit ?? row.TakeProfit ?? row.tp ?? row.TP),
    profit: numberValue(row.profit ?? row.Profit ?? row.pnl ?? row.PnL),
    swap: optionalNumber(row.swap ?? row.Swap),
    commission: optionalNumber(row.commission ?? row.Commission),
    openTime: toIsoString(
      row.openTime ?? row.timeCreate ?? row.TimeCreate ?? row.time ?? row.Time ?? row.openedAt,
    ),
  };
}

export function normalizeOrder(raw: unknown): Mt5Order | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const ticket = entityTicket(row);
  const symbol = stringValue(row.symbol ?? row.Symbol ?? row.instrument);
  if (!ticket || !symbol) return null;

  return {
    ticket,
    symbol,
    type: toOrderType(row.type ?? row.Type ?? row.orderType ?? row.OrderType ?? row.command),
    volume: lotsFromRow(row, symbol),
    price: numberValue(
      row.priceOpen ??
        row.PriceOpen ??
        row.price_order ??
        row.priceOrder ??
        row.PriceOrder ??
        row.orderPrice ??
        row.OrderPrice ??
        row.price ??
        row.Price ??
        row.openPrice ??
        row.OpenPrice ??
        row.entryPrice ??
        row.priceCurrent ??
        row.PriceCurrent,
    ),
    stopLoss: optionalPrice(row.stopLoss ?? row.StopLoss ?? row.sl ?? row.SL),
    takeProfit: optionalPrice(row.takeProfit ?? row.TakeProfit ?? row.tp ?? row.TP),
    state: stringValue(row.state ?? row.State ?? row.status ?? row.Status) || undefined,
    openTime: toIsoString(
      row.openTime ?? row.timeSetup ?? row.TimeSetup ?? row.timeCreate ?? row.time ?? row.createdAt,
    ),
  };
}

function isCompletedHistoryRow(row: Record<string, unknown>): boolean {
  const typeText = stringValue(row.type ?? row.Type).toLowerCase();
  if (typeText === 'balance') return false;

  const symbol = stringValue(row.symbol ?? row.Symbol ?? row.instrument);
  if (!symbol) return false;

  const entryDesc = stringValue(row.entryDescription ?? row.EntryDescription).toUpperCase();
  if (entryDesc.includes('OUT')) return true;
  if (entryDesc.includes('IN')) return false;

  const numericEntry = Number(row.entry ?? row.Entry);
  if (Number.isFinite(numericEntry)) {
    return numericEntry === 1 || numericEntry === 3;
  }

  return Boolean(row.closePrice ?? row.ClosePrice ?? row.priceClose ?? row.closedAt);
}

export function normalizeHistoryDeal(
  raw: unknown,
  inDealsMap?: Map<string, Record<string, unknown>>,
): Mt5HistoryDeal | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  if (!isCompletedHistoryRow(row)) return null;

  const ticket = entityTicket(row);
  const symbol = stringValue(row.symbol ?? row.Symbol ?? row.instrument);
  if (!ticket || !symbol) return null;

  const posId = row.positionId ?? row.PositionId;
  const inDeal = posId != null && posId !== 0 && posId !== '' ? inDealsMap?.get(String(posId)) : undefined;

  const rawOpen =
    row.openPrice ??
    row.priceOpen ??
    row.OpenPrice ??
    row.PriceOpen ??
    row.entryPrice ??
    row.EntryPrice ??
    (inDeal ? (inDeal.price ?? inDeal.Price ?? inDeal.openPrice ?? inDeal.priceOpen) : undefined);

  const rawClose =
    row.closePrice ??
    row.priceClose ??
    row.ClosePrice ??
    row.PriceClose ??
    row.exitPrice ??
    row.ExitPrice ??
    row.price ??
    row.Price;

  const closePrice = numberValue(rawClose);
  const openPrice = numberValue(rawOpen, closePrice);

  const entryDesc = stringValue(row.entryDescription ?? row.EntryDescription);
  const typeText = stringValue(row.type ?? row.Type);
  const action =
    entryDesc ||
    (typeText && typeText.toLowerCase() !== 'balance' ? typeText : '') ||
    stringValue(row.action ?? row.comment) ||
    'Closed';

  const originalSide = inDeal
    ? toOrderSide(inDeal.side ?? inDeal.Side ?? inDeal.type ?? inDeal.Type)
    : toOrderSide(row.side ?? row.Side ?? row.type ?? row.Type ?? row.command ?? row.action);

  return {
    ticket,
    symbol,
    type: originalSide,
    volume: lotsFromRow(row, symbol),
    price: closePrice,
    openPrice,
    closePrice,
    profit: numberValue(row.profit ?? row.Profit ?? row.pnl ?? row.PnL),
    commission: optionalNumber(row.commission ?? row.Commission),
    swap: optionalNumber(row.swap ?? row.Swap),
    action,
    time: toIsoString(
      row.closedAt ??
        row.closeTime ??
        row.timeClose ??
        row.TimeClose ??
        row.time ??
        row.Time ??
        row.createdAt,
    ),
  };
}

export function normalizePositions(payload: unknown): Mt5Position[] {
  return extractRows(payload, ['positions', 'Positions', 'positionList'])
    .map(normalizePosition)
    .filter((row): row is Mt5Position => row !== null);
}

export function normalizeOrders(payload: unknown): Mt5Order[] {
  return extractRows(payload, ['orders', 'Orders', 'pendingOrders', 'PendingOrders', 'orderList'])
    .map(normalizeOrder)
    .filter((row): row is Mt5Order => row !== null);
}

export function normalizeHistory(payload: unknown): Mt5HistoryDeal[] {
  const rows = extractRows(payload, ['items', 'data', 'result', 'deals', 'history']);

  const inDealsMap = new Map<string, Record<string, unknown>>();
  for (const raw of rows) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const entryDesc = stringValue(row.entryDescription ?? row.EntryDescription).toUpperCase();
    const entry = Number(row.entry ?? row.Entry);
    const posId = row.positionId ?? row.PositionId;
    if ((entryDesc.includes('IN') || entry === 0) && posId != null && posId !== 0 && posId !== '') {
      inDealsMap.set(String(posId), row);
    }
  }

  return rows
    .map((row) => normalizeHistoryDeal(row, inDealsMap))
    .filter((row): row is Mt5HistoryDeal => row !== null)
    .sort((a, b) => {
      const timeA = a.time ? new Date(a.time).getTime() : 0;
      const timeB = b.time ? new Date(b.time).getTime() : 0;
      if (timeA !== timeB && !Number.isNaN(timeA) && !Number.isNaN(timeB)) {
        return timeB - timeA;
      }
      return b.ticket - a.ticket;
    });
}

function decimalPlaces(value: unknown): number {
  const text = String(value ?? '');
  const decimal = text.indexOf('.');
  return decimal < 0 ? 0 : text.length - decimal - 1;
}

export function normalizeSymbol(raw: unknown): Mt5Symbol | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const symbol = stringValue(item.symbol ?? item.Symbol);
  if (!symbol) return null;

  const bidRaw = item.bid ?? item.Bid;
  const askRaw = item.ask ?? item.Ask;
  const bid = numberValue(bidRaw);
  const ask = numberValue(askRaw, bid);
  const digits = numberValue(
    item.digits ?? item.Digits,
    Math.max(decimalPlaces(bidRaw), decimalPlaces(askRaw), 5),
  );

  return {
    symbol,
    description:
      stringValue(item.description ?? item.Description ?? item.name ?? item.Name) || undefined,
    digits: Math.max(0, Math.trunc(digits)),
    bid,
    ask,
    spread: numberValue(item.spread ?? item.Spread, ask - bid),
    changePercent: numberValue(
      item.changePercent ?? item.changePct ?? item.ChangePct ?? item.ChangePercent,
    ),
    contractSize: optionalNumber(item.contractSize ?? item.ContractSize),
    volumeMin: optionalNumber(item.volumeMin ?? item.VolumeMin),
    volumeMax: optionalNumber(item.volumeMax ?? item.VolumeMax),
    volumeStep: optionalNumber(item.volumeStep ?? item.VolumeStep),
    volumeLimit: optionalNumber(item.volumeLimit ?? item.VolumeLimit),
    category: stringValue(item.category ?? item.Category) || undefined,
    path: stringValue(item.path ?? item.Path) || undefined,
    currency: stringValue(item.currency ?? item.Currency) || undefined,
    currencyProfit:
      stringValue(item.currencyProfit ?? item.CurrencyProfit) || undefined,
    currencyMargin:
      stringValue(item.currencyMargin ?? item.CurrencyMargin) || undefined,
    point: optionalNumber(item.point ?? item.Point),
    tickSize: optionalNumber(item.tickSize ?? item.TickSize),
    tickValue: optionalNumber(item.tickValue ?? item.TickValue),
    swapLong: optionalNumber(item.swapLong ?? item.SwapLong),
    swapShort: optionalNumber(item.swapShort ?? item.SwapShort),
    stopsLevel: optionalNumber(item.stopsLevel ?? item.StopsLevel),
    tradeMode: optionalNumber(item.tradeMode ?? item.TradeMode),
  };
}

export function normalizeSymbolsPayload(payload: unknown): Mt5Symbol[] {
  const rows = extractRows(payload, ['symbols', 'Symbols', 'items', 'data', 'result']);
  return rows
    .map(normalizeSymbol)
    .filter((symbol): symbol is Mt5Symbol => symbol !== null);
}

