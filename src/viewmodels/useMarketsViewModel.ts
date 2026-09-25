import { useState, useEffect, useCallback } from 'react';
import { MarketSymbol } from '../models';
import { tradingService } from '../services/api';

export const MARKET_CATEGORIES = ['All', 'Forex', 'Crypto', 'Commodities', 'Indices'];

export function useMarketsViewModel() {
  const [symbols, setSymbols] = useState<MarketSymbol[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSymbols = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tradingService.getMarketSymbols(selectedCategory);
      setSymbols(data);
    } catch (err) {
      console.error('Failed to load market symbols', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchSymbols();
  }, [fetchSymbols]);

  const filteredSymbols = symbols.filter(
    (item) =>
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    symbols: filteredSymbols,
    selectedCategory,
    searchQuery,
    loading,
    categories: MARKET_CATEGORIES,
    setSelectedCategory,
    setSearchQuery,
    refresh: fetchSymbols,
  };
}
