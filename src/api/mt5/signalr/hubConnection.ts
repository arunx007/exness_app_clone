import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  type ILogger,
} from '@microsoft/signalr';

import { apiConfig } from '../../config';
import { mt5Session } from '../session';

/**
 * SignalR's default ConsoleLogger uses console.error, which opens LogBox in Expo Go.
 * Network / negotiation failures are handled gracefully by our stream services.
 */
const quietHubLogger: ILogger = {
  log() {
    // Intentionally silent — avoid LogBox for expected offline / reconnect blips.
  },
};

/**
 * Builds a SignalR hub connection against the MT5 REST host.
 *
 * Hubs share the `apiConfig.mt5.baseUrl` host and authenticate with the
 * current MT5 session token via `accessTokenFactory`.
 */
export function buildMt5HubConnection(hubPath: string): HubConnection {
  const url = `${apiConfig.mt5.baseUrl}${hubPath}`;

  return new HubConnectionBuilder()
    .withUrl(url, {
      transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
      accessTokenFactory: () => mt5Session.getToken() ?? '',
    })
    .withAutomaticReconnect([0, 2_000, 5_000, 10_000])
    .configureLogging(quietHubLogger)
    .build();
}

/** True when start() lost a race with stop() — safe to ignore. */
export function isHubStartAbortedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    message.includes('stop() was called') ||
    message.includes('Failed to start the HttpConnection')
  );
}

/** True for offline / DNS / negotiation failures. */
export function isHubNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lower = message.toLowerCase();
  return (
    lower.includes('failed to complete negotiation') ||
    lower.includes('failed to start the connection') ||
    lower.includes('hostname could not be found') ||
    lower.includes('network request failed') ||
    lower.includes('fetch failed') ||
    lower.includes('could not connect') ||
    lower.includes('err_name_not_resolved') ||
    lower.includes('enotfound') ||
    lower.includes('unable to connect to the server with any of the available transports') ||
    lower.includes('websockets failed') ||
    lower.includes('websocket failed to connect') ||
    lower.includes('the connection could not be found on the server') ||
    lower.includes('longpolling failed') ||
    lower.includes('serversentevents failed')
  );
}
