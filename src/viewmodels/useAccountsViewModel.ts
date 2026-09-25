import { useState, useEffect, useCallback } from 'react';
import { TradingAccount, Position } from '../models';
import { tradingService } from '../services/api';

export function useAccountsViewModel() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TradingAccount | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [activeTab, setActiveTab] = useState<'REAL' | 'DEMO'>('REAL');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tradingService.getAccounts();
      setAccounts(data);
      const initial = data.find((acc) => acc.type === activeTab) || data[0];
      setSelectedAccount(initial || null);
    } catch (err) {
      console.error('Failed to load accounts', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchPositions = useCallback(async () => {
    try {
      const pos = await tradingService.getOpenPositions();
      setPositions(pos);
    } catch (err) {
      console.error('Failed to load positions', err);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchPositions();
  }, [fetchAccounts, fetchPositions]);

  const selectAccount = (acc: TradingAccount) => {
    setSelectedAccount(acc);
  };

  const setAccountTypeTab = (type: 'REAL' | 'DEMO') => {
    setActiveTab(type);
    const match = accounts.find((a) => a.type === type);
    if (match) {
      setSelectedAccount(match);
    }
  };

  const totalProfit = positions.reduce((acc, p) => acc + p.profit, 0);

  return {
    accounts,
    selectedAccount,
    positions,
    activeTab,
    loading,
    totalProfit,
    selectAccount,
    setAccountTypeTab,
    refresh: fetchAccounts,
  };
}
