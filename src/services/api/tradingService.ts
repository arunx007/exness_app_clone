import { TradingAccount, MarketSymbol, Position } from '../../models';
import { mockAccounts, mockSymbols, mockPositions } from '../../constants/mockData';

export class TradingService {
  async getAccounts(): Promise<TradingAccount[]> {
    return new Promise((resolve) => setTimeout(() => resolve(mockAccounts), 300));
  }

  async getMarketSymbols(category?: string): Promise<MarketSymbol[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (category && category !== 'All') {
          resolve(mockSymbols.filter((s: MarketSymbol) => s.category.toLowerCase() === category.toLowerCase()));
        } else {
          resolve(mockSymbols);
        }
      }, 300);
    });
  }

  async getOpenPositions(): Promise<Position[]> {
    return new Promise((resolve) => setTimeout(() => resolve(mockPositions), 300));
  }
}

export const tradingService = new TradingService();
