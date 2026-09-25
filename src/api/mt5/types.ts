/**
 * MT5 API request/response models.
 */

export type OrderSide = 'BUY' | 'SELL';

export type OrderType =
  | 'BUY'
  | 'SELL'
  | 'BUY_LIMIT'
  | 'SELL_LIMIT'
  | 'BUY_STOP'
  | 'SELL_STOP';

export type PasswordType = 'Main' | 'Investor';

export type Mt5LoginRequest = {
  login: number;
  password: string;
  passwordType?: PasswordType;
};

export type Mt5LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  login?: number;
};

export type Mt5Profile = {
  login: number;
  name?: string;
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  leverage: number;
  credit?: number;
  profit?: number;
};

export type Mt5Symbol = {
  symbol: string;
  description?: string;
  digits: number;
  bid: number;
  ask: number;
  spread: number;
  changePercent: number;
  contractSize?: number;
  volumeMin?: number;
  volumeMax?: number;
  volumeStep?: number;
  volumeLimit?: number;
  category?: string;
  path?: string;
  currency?: string;
  currencyProfit?: string;
  currencyMargin?: string;
  point?: number;
  tickSize?: number;
  tickValue?: number;
  swapLong?: number;
  swapShort?: number;
  stopsLevel?: number;
  tradeMode?: number;
};

export type Mt5Position = {
  ticket: number;
  symbol: string;
  type: OrderSide;
  volume: number;
  openPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  profit: number;
  swap?: number;
  commission?: number;
  openTime: string;
};

export type Mt5Order = {
  ticket: number;
  symbol: string;
  type: OrderType;
  volume: number;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
  state?: string;
  openTime: string;
};

export type PlaceMarketOrderRequest = {
  symbol: string;
  side: OrderSide;
  volume: number;
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
};

export type PlacePendingOrderRequest = {
  symbol: string;
  type: OrderType | 'BuyLimit' | 'SellLimit' | 'BuyStop' | 'SellStop';
  volume: number;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
};

export type ModifyPositionRequest = {
  ticket: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
};

export type ModifyOrderRequest = {
  ticket: number;
  price?: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
};

export type ClosePositionRequest = {
  ticket: number;
  volume?: number;
  symbol?: string;
};

export type OrderResult = {
  ticket: number;
  retcode?: number;
  message?: string;
};

export type Mt5HistoryQuery = {
  from?: string;
  to?: string;
  symbol?: string;
  page?: number;
  pageSize?: number;
};

export type Mt5HistoryDeal = {
  ticket: number;
  symbol: string;
  type: OrderSide;
  volume: number;
  price: number;
  openPrice: number;
  closePrice: number;
  profit: number;
  commission?: number;
  swap?: number;
  action?: string;
  time: string;
};

export type Mt5TransferRequest = {
  fromLogin: number;
  toLogin: number;
  amount: number;
  comment?: string;
};

export type Mt5FundingRequest = {
  login: number;
  amount: number;
  comment?: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  passwordType?: PasswordType;
};
