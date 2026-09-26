import { HubConnection, HubConnectionState } from '@microsoft/signalr';

import { toErrorMessage } from '../../errors';
import { MT5_ENDPOINTS } from '../endpoints';
import { mergeProfile, normalizeProfile } from '../normalize';
import type { Mt5Profile } from '../types';
import { buildMt5HubConnection, isHubNetworkError, isHubStartAbortedError } from './hubConnection';

export type AccountStreamHandlers = {
  onProfile?: (profile: Mt5Profile) => void;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void;
  onError?: (message: string) => void;
};

/**
 * Real-time MT5 account hub (balance, equity, free margin).
 *
 * Matches the reference contract: AccountData / AccountUpdate / AccountInfo
 * plus GetCurrentAccount after connect/reconnect.
 */
export class AccountStreamService {
  private connection: HubConnection | null = null;
  private handlers: AccountStreamHandlers | null = null;
  private snapshot: Mt5Profile | null = null;
  /** Bumped on every start/stop so in-flight handshakes can be abandoned cleanly. */
  private generation = 0;

  async start(handlers: AccountStreamHandlers): Promise<void> {
    const generation = ++this.generation;
    await this.teardownConnection();
    if (generation !== this.generation) return;

    this.handlers = handlers;
    this.snapshot = null;

    const connection = buildMt5HubConnection(MT5_ENDPOINTS.HUBS.ACCOUNT);
    this.connection = connection;

    const apply = (payload: unknown) => {
      if (generation !== this.generation) return;
      const next = normalizeProfile(payload);
      if (!next) return;
      this.snapshot = mergeProfile(this.snapshot, next);
      this.handlers?.onProfile?.(this.snapshot);
    };

    connection.on('AccountData', apply);
    connection.on('AccountUpdate', apply);
    connection.on('AccountInfo', apply);
    connection.on('ProfileUpdated', apply);
    connection.on('BalanceUpdated', (balance: number) => {
      if (generation !== this.generation) return;
      if (!this.snapshot && !Number.isFinite(balance)) return;
      this.snapshot = mergeProfile(this.snapshot, { balance: Number(balance) });
      this.handlers?.onProfile?.(this.snapshot);
    });
    connection.on('Error', (payload: unknown) => {
      if (generation !== this.generation) return;
      const message =
        typeof payload === 'object' && payload && 'message' in payload
          ? String((payload as { message?: string }).message ?? 'Account stream error')
          : 'Account stream error';
      this.handlers?.onError?.(message);
    });

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
      this.handlers?.onError?.(toErrorMessage(error, 'Account stream failed to connect'));
      this.handlers?.onStatusChange?.('disconnected');
    }
  }

  async stop(): Promise<void> {
    this.generation += 1;
    this.handlers = null;
    this.snapshot = null;
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

  private async refresh(generation: number): Promise<void> {
    if (generation !== this.generation) return;
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) return;
    try {
      await this.connection.invoke('GetCurrentAccount');
    } catch {
      // AccountData is pushed automatically for client JWTs.
    }
  }
}

export const accountStream = new AccountStreamService();
