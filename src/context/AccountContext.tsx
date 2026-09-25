import React, { createContext, useContext, useState } from 'react';
import { AccountItem } from '../components/modals/SwitchAccountModal';

interface AccountContextType {
  accounts: AccountItem[];
  activeAccount: AccountItem;
  setActiveAccount: (account: AccountItem) => void;
  addAccount: (account: AccountItem) => void;
  updateBalance: (id: string, newBalance: string) => void;
}

const INITIAL_ACCOUNTS: AccountItem[] = [
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

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<AccountItem[]>(INITIAL_ACCOUNTS);
  const [activeAccount, setActiveAccount] = useState<AccountItem>(INITIAL_ACCOUNTS[0]);

  const addAccount = (newAccount: AccountItem) => {
    setAccounts((prev) => [newAccount, ...prev]);
    setActiveAccount(newAccount);
  };

  const updateBalance = (id: string, newBalance: string) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, balance: newBalance } : acc))
    );
    if (activeAccount.id === id) {
      setActiveAccount((prev) => ({ ...prev, balance: newBalance }));
    }
  };

  return (
    <AccountContext.Provider
      value={{
        accounts,
        activeAccount,
        setActiveAccount,
        addAccount,
        updateBalance,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = (): AccountContextType => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};
