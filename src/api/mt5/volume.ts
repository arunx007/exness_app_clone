/** Round to broker lot precision (2 decimal places). */
export function roundLots(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * MT5 portal volume multiplier for a broker symbol.
 */
export function mt5VolumeMultiplier(symbol?: string): number {
  const upper = String(symbol ?? '').toUpperCase();
  if (
    upper.includes('XAU') ||
    upper.includes('GOLD') ||
    upper.includes('XAG') ||
    upper.includes('SILVER')
  ) {
    return 100;
  }
  if (upper.includes('BTC') || upper.includes('ETH')) {
    return 100;
  }
  if (
    upper.includes('US500') ||
    upper.includes('US30') ||
    upper.includes('US100')
  ) {
    return 1;
  }
  return 100;
}

/**
 * Convert user-facing lots to the portal's volume units.
 */
export function lotsToMt5Volume(lots: number, symbol?: string): number {
  const n = Number(lots);
  if (!Number.isFinite(n) || n <= 0) return 1;

  const multiplier = mt5VolumeMultiplier(symbol);
  return Number((n * multiplier).toFixed(8));
}

/**
 * Convert portal / MT5 volume units to user-facing lots.
 */
export function mt5VolumeToLots(value: unknown, symbol?: string): number {
  const n =
    typeof value === 'number'
      ? value
      : Number(String(value ?? '').replace(/,/g, '').trim());
  if (!Number.isFinite(n) || n <= 0) return 0.01;

  const upper = String(symbol ?? '').toUpperCase();
  const divisor = mt5VolumeMultiplier(symbol);

  // Micro-units from raw MT5 deals (10,000 micro-units = 0.01 lots)
  if (n >= 1000) return roundLots(n / 1_000_000);
  // Already fractional lots (e.g. 0.01, 0.50)
  if (n < 1) return roundLots(n);
  // API volume units (e.g. 1 unit = 0.01 lots, 100 units = 1.00 lot)
  if (upper.includes('BTC') || upper.includes('ETH') || divisor === 100) {
    return roundLots(n / 100);
  }
  return roundLots(n >= divisor ? n / divisor : n);
}

/**
 * Pick the best raw volume field from an MT5 position/order payload.
 */
export function resolveMt5Lots(row: Record<string, unknown>, symbol: string): number {
  const rawVolume =
    row.volumeCurrent ??
    row.VolumeCurrent ??
    row.volume ??
    row.Volume ??
    row.volumeLots ??
    row.VolumeLots ??
    row.lots ??
    row.Lots ??
    row.volumeInitial ??
    row.VolumeInitial;

  if (rawVolume != null && rawVolume !== '') {
    const fromVolume = mt5VolumeToLots(rawVolume, symbol);
    if (fromVolume > 0) return fromVolume;
  }

  return 0.01;
}
