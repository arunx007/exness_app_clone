import { MT5_ENDPOINTS } from './endpoints';
import { mt5Request } from './mt5Client';
import {
  normalizeHistory,
  normalizeOrders,
  normalizePositions,
  normalizeProfile,
} from './normalize';
import type {
  ChangePasswordRequest,
  ClosePositionRequest,
  Mt5FundingRequest,
  Mt5HistoryDeal,
  Mt5HistoryQuery,
  Mt5Order,
  Mt5Position,
  Mt5Profile,
  Mt5TransferRequest,
  ModifyOrderRequest,
  ModifyPositionRequest,
  OrderResult,
  PlaceMarketOrderRequest,
  PlacePendingOrderRequest,
} from './types';
import { lotsToMt5Volume } from './volume';

export const mt5TradingService = {
  /* Profile / Account */
  async getProfile(signal?: AbortSignal): Promise<Mt5Profile> {
    const payload = await mt5Request<unknown>(MT5_ENDPOINTS.TRADING.PROFILE, { signal });
    const profile = normalizeProfile(payload);
    if (!profile) {
      throw new Error('MT5 profile response was empty');
    }
    return profile;
  },

  changePassword(payload: ChangePasswordRequest): Promise<OrderResult> {
    return mt5Request<OrderResult>(MT5_ENDPOINTS.TRADING.CHANGE_PASSWORD, {
      method: 'POST',
      body: payload,
    });
  },

  /* Positions */
  async getPositions(signal?: AbortSignal): Promise<Mt5Position[]> {
    const payload = await mt5Request<unknown>(MT5_ENDPOINTS.TRADING.POSITIONS, { signal });
    return normalizePositions(payload);
  },

  async getPosition(ticket: number, signal?: AbortSignal): Promise<Mt5Position> {
    const payload = await mt5Request<unknown>(MT5_ENDPOINTS.TRADING.POSITION, {
      query: { ticket },
      signal,
    });
    const position = normalizePositions(payload)[0] ?? normalizePositions([payload])[0];
    if (!position) {
      throw new Error(`MT5 position ${ticket} was not found`);
    }
    return position;
  },

  modifyPosition(payload: ModifyPositionRequest): Promise<OrderResult> {
    const body: Record<string, unknown> = {
      positionId: String(payload.ticket),
    };
    if (payload.stopLoss !== undefined) {
      body.stopLoss =
        typeof payload.stopLoss === 'number' &&
        Number.isFinite(payload.stopLoss) &&
        payload.stopLoss > 0
          ? payload.stopLoss
          : null;
    }
    if (payload.takeProfit !== undefined) {
      body.takeProfit =
        typeof payload.takeProfit === 'number' &&
        Number.isFinite(payload.takeProfit) &&
        payload.takeProfit > 0
          ? payload.takeProfit
          : null;
    }
    return mt5Request<OrderResult>(
      `${MT5_ENDPOINTS.TRADING.POSITION}/${encodeURIComponent(payload.ticket)}`,
      {
        method: 'PUT',
        body,
      },
    );
  },

  closePosition(payload: ClosePositionRequest): Promise<OrderResult> {
    return mt5Request<OrderResult>(
      `${MT5_ENDPOINTS.TRADING.POSITION}/${encodeURIComponent(payload.ticket)}`,
      {
        method: 'DELETE',
        body: {
          positionId: String(payload.ticket),
          ...(payload.volume !== undefined
            ? { volume: lotsToMt5Volume(payload.volume, payload.symbol ?? '') }
            : null),
        },
      },
    );
  },

  /* Orders */
  async getOrders(signal?: AbortSignal): Promise<Mt5Order[]> {
    const payload = await mt5Request<unknown>(MT5_ENDPOINTS.TRADING.ORDERS, { signal });
    return normalizeOrders(payload);
  },

  modifyOrder(payload: ModifyOrderRequest): Promise<OrderResult> {
    const body: Record<string, unknown> = {
      orderId: payload.ticket,
    };
    if (payload.price !== undefined) {
      body.price = payload.price;
    }
    if (payload.stopLoss !== undefined) {
      body.stopLoss =
        typeof payload.stopLoss === 'number' &&
        Number.isFinite(payload.stopLoss) &&
        payload.stopLoss > 0
          ? payload.stopLoss
          : null;
    }
    if (payload.takeProfit !== undefined) {
      body.takeProfit =
        typeof payload.takeProfit === 'number' &&
        Number.isFinite(payload.takeProfit) &&
        payload.takeProfit > 0
          ? payload.takeProfit
          : null;
    }
    return mt5Request<OrderResult>(
      `${MT5_ENDPOINTS.TRADING.ORDER}/${encodeURIComponent(payload.ticket)}`,
      {
        method: 'PUT',
        body,
      },
    );
  },

  placeMarketOrder(payload: PlaceMarketOrderRequest): Promise<OrderResult> {
    return mt5Request<OrderResult>(MT5_ENDPOINTS.TRADING.MARKET_ORDER, {
      method: 'POST',
      body: {
        symbol: payload.symbol,
        type: payload.side === 'BUY' ? 'Buy' : 'Sell',
        volume: lotsToMt5Volume(payload.volume, payload.symbol),
        comment: payload.comment ?? 'Client App',
        stopLoss: payload.stopLoss ?? null,
        takeProfit: payload.takeProfit ?? null,
      },
    });
  },

  placePendingOrder(payload: PlacePendingOrderRequest): Promise<OrderResult> {
    const symbol = String(payload.symbol ?? '').trim();
    if (!symbol) return Promise.reject(new Error('Symbol is required.'));
    if (!Number.isFinite(payload.volume) || payload.volume <= 0) {
      return Promise.reject(new Error('Lots must be greater than 0.'));
    }
    if (!Number.isFinite(payload.price) || payload.price <= 0) {
      return Promise.reject(new Error('Pending price must be greater than 0.'));
    }

    const typeMap: Record<string, string> = {
      BUY_LIMIT: 'BuyLimit',
      SELL_LIMIT: 'SellLimit',
      BUY_STOP: 'BuyStop',
      SELL_STOP: 'SellStop',
      BuyLimit: 'BuyLimit',
      SellLimit: 'SellLimit',
      BuyStop: 'BuyStop',
      SellStop: 'SellStop',
    };

    const apiType = typeMap[payload.type] ?? payload.type;

    const body: Record<string, unknown> = {
      symbol,
      type: apiType,
      volume: lotsToMt5Volume(payload.volume, symbol),
      price: payload.price,
      comment: payload.comment?.trim() || 'Client App',
    };

    if (payload.stopLoss) body.stopLoss = payload.stopLoss;
    if (payload.takeProfit) body.takeProfit = payload.takeProfit;

    return mt5Request<OrderResult>(MT5_ENDPOINTS.TRADING.ORDER, {
      method: 'POST',
      body,
    });
  },

  cancelOrder(ticket: number): Promise<OrderResult> {
    return mt5Request<OrderResult>(
      `${MT5_ENDPOINTS.TRADING.ORDER}/${encodeURIComponent(ticket)}`,
      {
        method: 'DELETE',
        body: { orderId: String(ticket) },
      },
    );
  },

  /* History */
  async getHistory(
    query: Mt5HistoryQuery = {},
    signal?: AbortSignal,
  ): Promise<Mt5HistoryDeal[]> {
    const payload = await mt5Request<unknown>(MT5_ENDPOINTS.TRADING.HISTORY, {
      query: {
        from: query.from,
        to: query.to,
        symbol: query.symbol,
        page: query.page,
        pageSize: query.pageSize,
      },
      signal,
    });
    return normalizeHistory(payload);
  },

  /* Funding */
  transfer(payload: Mt5TransferRequest): Promise<OrderResult> {
    return mt5Request<OrderResult>(MT5_ENDPOINTS.TRADING.TRANSFER, {
      method: 'POST',
      body: payload,
    });
  },

  deposit(payload: Mt5FundingRequest): Promise<OrderResult> {
    return mt5Request<OrderResult>(MT5_ENDPOINTS.TRADING.DEPOSIT, {
      method: 'POST',
      body: payload,
    });
  },

  withdraw(payload: Mt5FundingRequest): Promise<OrderResult> {
    return mt5Request<OrderResult>(MT5_ENDPOINTS.TRADING.WITHDRAW, {
      method: 'POST',
      body: payload,
    });
  },
};
