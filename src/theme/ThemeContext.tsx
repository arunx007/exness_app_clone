import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, ThemeMode } from './colors';
import { Spacing, Typography, BorderRadius } from './spacing';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: typeof Colors.dark;
  brand: typeof Colors.brand;
  trading: typeof Colors.trading;
  spacing: typeof Spacing;
  typography: typeof Typography;
  borderRadius: typeof BorderRadius;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  const toggleTheme = () => {
    setMode('light');
  };

  const themeValues: ThemeContextType = {
    mode: 'light',
    isDark: false,
    colors: Colors.light,
    brand: Colors.brand,
    trading: Colors.trading,
    spacing: Spacing,
    typography: Typography,
    borderRadius: BorderRadius,
    setMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={themeValues}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
