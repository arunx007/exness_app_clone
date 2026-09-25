/**
 * Chart/quote identity — match normalizeChartSymbol:
 * BTCUSD.vs / BTCUSD.v / BTCUSDm → BTCUSD
 */
export function normalizeMarketSymbol(symbol: string): string {
  return symbol
    .trim()
    .toUpperCase()
    .split('.')[0]
    .replace(/[^A-Z0-9]/g, '')
    .replace(/[MACFHR]+$/i, '');
}

/** Match base and broker-suffixed variants such as EURUSD ↔ EURUSDm ↔ EURUSD.v. */
export function marketSymbolsMatch(left: string, right: string): boolean {
  const a = normalizeMarketSymbol(left);
  const b = normalizeMarketSymbol(right);
  if (!a || !b) return false;
  if (a === b) return true;
  return a.length >= 6 && b.length >= 6 && (a.startsWith(b) || b.startsWith(a));
}

const ASSET_NAMES: Record<string, string> = {
  AED: 'UAE Dirham',
  AUD: 'Australian Dollar',
  BNB: 'BNB',
  BRL: 'Brazilian Real',
  BTC: 'Bitcoin',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan',
  DOG: 'Dogecoin',
  ETH: 'Ethereum',
  EUR: 'Euro',
  GBP: 'British Pound',
  HKD: 'Hong Kong Dollar',
  INR: 'Indian Rupee',
  JPY: 'Japanese Yen',
  MXN: 'Mexican Peso',
  NAS100: 'US Tech 100',
  NZD: 'New Zealand Dollar',
  SOL: 'Solana',
  US30: 'Wall Street 30',
  USD: 'US Dollar',
  USDC: 'USD Coin',
  USDT: 'Tether',
  XAG: 'Silver',
  XAU: 'Gold',
  XRP: 'XRP',
};

const KNOWN_ASSET_CODES = Object.keys(ASSET_NAMES).sort(
  (left, right) => right.length - left.length,
);

function splitAssetPair(symbol: string): [string, string] | null {
  const base = normalizeMarketSymbol(symbol);
  if (!base) return null;

  for (const first of KNOWN_ASSET_CODES) {
    if (!base.startsWith(first)) continue;
    const rest = base.slice(first.length);
    if (!rest) return null;
    const second = KNOWN_ASSET_CODES.find(
      (code) => rest === code || rest.startsWith(code),
    );
    if (second) return [first, second];
  }
  return null;
}

/** Human subtitle for a watchlist row, e.g. EURUSD → "Euro vs US Dollar". */
export function symbolDisplayName(symbol: string): string {
  const pair = splitAssetPair(symbol);
  if (!pair) {
    const normalized = normalizeMarketSymbol(symbol);
    return ASSET_NAMES[normalized] ?? (normalized || symbol);
  }
  const [left, right] = pair;
  const leftName = ASSET_NAMES[left] ?? left;
  const rightName = ASSET_NAMES[right] ?? right;
  if (left === 'XAU' || left === 'XAG') return `${leftName} vs ${rightName}`;
  if (
    left === 'BTC' ||
    left === 'ETH' ||
    left === 'SOL' ||
    left === 'XRP' ||
    left === 'BNB'
  ) {
    return `${leftName} / ${rightName}`;
  }
  return `${leftName} vs ${rightName}`;
}
