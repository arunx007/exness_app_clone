import { HubConnection, HubConnectionState } from '@microsoft/signalr';

import { toErrorMessage } from '../../errors';
import { MT5_ENDPOINTS } from '../endpoints';
import {
  extractObject,
  normalizeOrder,
  normalizeOrders,
  normalizePosition,
  normalizePositions,
  numberValue,
} from '../normalize';
import type { Mt5Order, Mt5Position } from '../types';
import { buildMt5HubConnection, isHubNetworkError, isHubStartAbortedError } from './hubConnection';

export type TradingStreamHandlers = {
  /** Full authoritative replacement for open positions (including empty). */
  onPositionsSnapshot?: (positions: Mt5Position[], authoritative: boolean) => void;
  onPositionUpsert?: (position: Mt5Position) => void;
  onPositionRemoved?: (ticket: number) => void;
  /** Full authoritative replacement for pending orders (including empty). */
  onOrdersSnapshot?: (orders: Mt5Order[], authoritative: boolean) => void;
  onOrderUpsert?: (order: Mt5Order) => void;
  onOrderRemoved?: (ticket: number) => void;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void;
  onError?: (message: string) => void;
};

function ticketFromPayload(payload: unknown): number {
  if (typeof payload === 'number' || typeof payload === 'string') {
    return numberValue(payload);
  }
  if (!payload || typeof payload !== 'object') return 0;
  const record = payload as Record<string, unknown>;
  const nested =
    extractObject(payload, ['position', 'Position', 'order', 'Order']) ?? record;
  return numberValue(
    nested.ticket ??
      nested.Ticket ??
      nested.id ??
      nested.Id ??
      nested.positionId ??
      nested.PositionId ??
      nested.orderId ??
      nested.OrderId,
  );
}

function mergePosition(current: Mt5Position | undefined, next: Mt5Position): Mt5Position {
  if (!current) return next;
  return {
    ...current,
    ...next,
    stopLoss: next.stopLoss !== undefined ? next.stopLoss : current.stopLoss,
    takeProfit: next.takeProfit !== undefined ? next.takeProfit : current.takeProfit,
    swap: next.swap !== undefined ? next.swap : current.swap,
    commission: next.commission !== undefined ? next.commission : current.commission,
  };
}

function mergeOrder(current: Mt5Order | undefined, next: Mt5Order): Mt5Order {
  if (!current) return next;
  return {
    ...current,
    ...next,
    stopLoss: next.stopLoss !== undefined ? next.stopLoss : current.stopLoss,
    takeProfit: next.takeProfit !== undefined ? next.takeProfit : current.takeProfit,
    state: next.state !== undefined ? next.state : current.state,
  };
}

/**
 * Real-time MT5 trading hub (open positions & pending orders).
 *
 * Matches the reference contract: InitialData plus Position/Order add-update-remove
 * events and GetCurrentData after connect/reconnect.
 */
export class TradingStreamService {
  private connection: HubConnection | null = null;
  private handlers: TradingStreamHandlers | null = null;
  private positions: Mt5Position[] = [];
  private orders: Mt5Order[] = [];
  private receivedPositionsSnapshot = false;
  private receivedOrdersSnapshot = false;
  /** Bumped on every start/stop so in-flight handshakes can be abandoned cleanly. */
  private generation = 0;

  async start(handlers: TradingStreamHandlers): Promise<void> {
    const generation = ++this.generation;
    await this.teardownConnection();
    if (generation !== this.generation) return;

    this.handlers = handlers;
    this.positions = [];
    this.orders = [];
    this.receivedPositionsSnapshot = false;
    this.receivedOrdersSnapshot = false;

    const connection = buildMt5HubConnection(MT5_ENDPOINTS.HUBS.TRADING);
    this.connection = connection;
    this.bindEvents(connection, generation);

    connection.onreconnecting(() => {
      if (generation !== this.generation) return;
      this.handlers?.onStatusChange?.('connecting');
    });
    connection.onreconnected(() => {
      if (generation !== this.generation) return;
      this.handlers?.onStatusChange?.('connected');
      void this.refresh(generation);
    });
    connection.onclose(() => {
      if (generation !== this.generation) return;
      this.handlers?.onStatusChange?.('disconnected');
    });

    try {
      this.handlers?.onStatusChange?.('connecting');
      await connection.start();
      if (generation !== this.generation) {
        try {
          await connection.stop();
        } catch {
          /* superseded */
        }
        return;
      }
      this.handlers?.onStatusChange?.('connected');
      await this.refresh(generation);
    } catch (error) {
      if (generation !== this.generation || isHubStartAbortedError(error)) return;
      if (isHubNetworkError(error)) {
        this.handlers?.onStatusChange?.('disconnected');
        return;
      }
      this.handlers?.onError?.(toErrorMessage(error, 'Trading stream failed to connect'));
      this.handlers?.onStatusChange?.('disconnected');
    }
  }

  async stop(): Promise<void> {
    this.generation += 1;
    this.handlers = null;
    this.positions = [];
    this.orders = [];
    this.receivedPositionsSnapshot = false;
    this.receivedOrdersSnapshot = false;
    await this.teardownConnection();
  }

  private async teardownConnection(): Promise<void> {
    const connection = this.connection;
    this.connection = null;
    if (!connection) return;
    try {
      await connection.stop();
    } catch {
      /* already stopped / aborted mid-start */
    }
  }

  private bindEvents(connection: HubConnection, generation: number): void {
    const handleInitial = (data: unknown) => {
      if (generation !== this.generation) return;
      // Authoritative replacement — empty arrays are intentional and must win over REST.
      this.positions = normalizePositions(data);
      this.orders = normalizeOrders(data);
      this.receivedPositionsSnapshot = true;
      this.receivedOrdersSnapshot = true;
      this.handlers?.onPositionsSnapshot?.(this.positions, true);
      this.handlers?.onOrdersSnapshot?.(this.orders, true);
    };

    connection.on('InitialData', handleInitial);
    connection.on('initialdata', handleInitial);
    connection.on('InitialTradeData', handleInitial);
    connection.on('initialtradedata', handleInitial);

    const upsertPosition = (payload: unknown) => {
      if (generation !== this.generation) return;
      const entity =
        normalizePosition(extractObject(payload, ['position', 'Position']) ?? payload) ??
        normalizePositions(payload)[0];
      if (!entity) return;
      const index = this.positions.findIndex((item) => item.ticket === entity.ticket);
      const merged = mergePosition(index >= 0 ? this.positions[index] : undefined, entity);
      if (index >= 0) {
        const next = [...this.positions];
        next[index] = merged;
        this.positions = next;
      } else {
        this.positions = [merged, ...this.positions];
      }
      this.handlers?.onPositionUpsert?.(merged);
    };

    const removePosition = (payload: unknown) => {
      if (generation !== this.generation) return;
      const ticket = ticketFromPayload(payload);
      if (!ticket) return;
      this.positions = this.positions.filter((item) => item.ticket !== ticket);
      this.handlers?.onPositionRemoved?.(ticket);
    };

    const upsertOrder = (payload: unknown) => {
      if (generation !== this.generation) return;
      const entity =
        normalizeOrder(extractObject(payload, ['order', 'Order']) ?? payload) ??
        normalizeOrders(payload)[0];
      if (!entity) return;
      const index = this.orders.findIndex((item) => item.ticket === entity.ticket);
      const merged = mergeOrder(index >= 0 ? this.orders[index] : undefined, entity);
      if (index >= 0) {
        const next = [...this.orders];
        next[index] = merged;
        this.orders = next;
      } else {
        this.orders = [merged, ...this.orders];
      }
      this.handlers?.onOrderUpsert?.(merged);
    };

    const removeOrder = (payload: unknown) => {
      if (generation !== this.generation) return;
      const ticket = ticketFromPayload(payload);
      if (!ticket) return;
      this.orders = this.orders.filter((item) => item.ticket !== ticket);
      this.handlers?.onOrderRemoved?.(ticket);
    };

    connection.on('PositionAdded', upsertPosition);
    connection.on('PositionUpdated', upsertPosition);
    connection.on('positionadded', upsertPosition);
    connection.on('positionupdated', upsertPosition);
    connection.on('PositionRemoved', removePosition);
    connection.on('positionremoved', removePosition);

    connection.on('OrderAdded', upsertOrder);
    connection.on('OrderUpdated', upsertOrder);
    connection.on('orderadded', upsertOrder);
    connection.on('orderupdated', upsertOrder);
    connection.on('OrderRemoved', removeOrder);
    connection.on('orderremoved', removeOrder);

    // Compatibility with earlier provisional event names.
    connection.on('PositionsSnapshot', (positions: unknown) => {
      if (generation !== this.generation) return;
      this.positions = normalizePositions(positions);
      this.receivedPositionsSnapshot = true;
      this.handlers?.onPositionsSnapshot?.(this.positions, true);
    });
    connection.on('OrdersSnapshot', (orders: unknown) => {
      if (generation !== this.generation) return;
      this.orders = normalizeOrders(orders);
      this.receivedOrdersSnapshot = true;
      this.handlers?.onOrdersSnapshot?.(this.orders, true);
    });
  }

  private async refresh(generation: number): Promise<void> {
    if (generation !== this.generation) return;
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) return;
    try {
      await this.connection.invoke('GetCurrentData');
    } catch {
      // InitialData is already pushed for client JWTs.
    }
  }
}

export const tradingStream = new TradingStreamService();
