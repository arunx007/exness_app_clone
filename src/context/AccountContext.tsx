import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AccountItem } from '../components/modals/SwitchAccountModal';
import {
  brokerTradingAccountsService,
  brokerSession,
  ensureMt5Session,
  startMt5SessionFromCrm,
  type BrokerTradingAccount,
} from '../api';

const ACTIVE_ACCOUNT_STORAGE_KEY = 'exness-clone.active-account.v1';

interface AccountContextType {
  accounts: AccountItem[];
  activeAccount: AccountItem;
  isLoadingAccounts: boolean;
  setActiveAccount: (account: AccountItem) => Promise<void>;
  addAccount: (account: AccountItem) => void;
  updateBalance: (id: string, newBalance: string) => void;
  refreshAccounts: () => Promise<void>;
}

const INITIAL_FALLBACK_ACCOUNTS: AccountItem[] = [
  {
    id: 'demo-15000113413',
    accountNumber: '15000113413',
    type: 'Demo',
    server: 'Exness',
    plan: 'Standard',
    balance: '9,996.15',
    currency: 'USD',
  },
  {
    id: 'real-14000102647',
    accountNumber: '14000102647',
    type: 'Real',
    server: 'Exness',
    plan: 'Standard',
    balance: '0.00',
    currency: 'USD',
  },
];

const AccountContext = createContext<AccountContextType | undefined>(undefined);

function mapBrokerAccount(acc: BrokerTradingAccount): AccountItem {
  const isDemo = Boolean(acc.is_demo);
  const rawBalance = Number(acc.balance ?? 0);
  const formattedBalance = Number.isFinite(rawBalance)
    ? rawBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';

  return {
    id: String(acc.id ?? acc.account_number),
    accountNumber: String(acc.account_number),
    type: isDemo ? 'Demo' : 'Real',
    server: acc.trading_server || 'Exness',
    plan: acc.account_type || acc.mt5_group || 'Standard',
    balance: formattedBalance,
    currency: acc.currency || 'USD',
  };
}

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<AccountItem[]>(INITIAL_FALLBACK_ACCOUNTS);
  const [activeAccount, setActiveAccountState] = useState<AccountItem>(INITIAL_FALLBACK_ACCOUNTS[0]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!brokerSession.isAuthenticated()) return;

    setIsLoadingAccounts(true);
    try {
      const liveAccounts = await brokerTradingAccountsService.list();
      if (Array.isArray(liveAccounts) && liveAccounts.length > 0) {
        const mapped = liveAccounts.map(mapBrokerAccount);
        setAccounts(mapped);

        // Check if there was a saved active account number
        let candidate: AccountItem | undefined;
        if (Platform.OS !== 'web') {
          const savedNum = await SecureStore.getItemAsync(ACTIVE_ACCOUNT_STORAGE_KEY);
          if (savedNum) {
            candidate = mapped.find((a) => a.accountNumber === savedNum);
          }
        }

        // Fallback to first demo account, or first real account
        if (!candidate) {
          candidate = mapped.find((a) => a.type === 'Demo') || mapped[0];
        }

        if (candidate) {
          setActiveAccountState(candidate);
          // Auto bootstrap MT5 session for this account
          void ensureMt5Session(candidate.accountNumber);
        }
      }
    } catch (err) {
      console.warn('[AccountContext] Failed to load trading accounts:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  // Fetch accounts whenever user authenticates or on mount
  useEffect(() => {
    fetchAccounts();
    const unsub = brokerSession.subscribe((tokens) => {
      if (tokens.accessToken) {
        fetchAccounts();
      }
    });
    return () => unsub();
  }, [fetchAccounts]);

  const setActiveAccount = useCallback(async (account: AccountItem) => {
    setActiveAccountState(account);
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(ACTIVE_ACCOUNT_STORAGE_KEY, account.accountNumber);
      } catch {}
    }

    // Switch MT5 account session token
    try {
      await startMt5SessionFromCrm(account.accountNumber);
    } catch (err) {
      console.warn('[AccountContext] Could not switch MT5 session for', account.accountNumber, err);
    }
  }, []);

  const addAccount = useCallback((newAccount: AccountItem) => {
    setAccounts((prev) => [newAccount, ...prev]);
    setActiveAccountState(newAccount);
  }, []);

  const updateBalance = useCallback((id: string, newBalance: string) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, balance: newBalance } : acc)),
    );
    setActiveAccountState((prev) => (prev.id === id ? { ...prev, balance: newBalance } : prev));
  }, []);

  const value = useMemo(
    () => ({
      accounts,
      activeAccount,
      isLoadingAccounts,
      setActiveAccount,
      addAccount,
      updateBalance,
      refreshAccounts: fetchAccounts,
    }),
    [accounts, activeAccount, isLoadingAccounts, setActiveAccount, addAccount, updateBalance, fetchAccounts],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
};

export const useAccount = (): AccountContextType => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};
