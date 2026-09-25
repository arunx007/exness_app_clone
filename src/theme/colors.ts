export const Colors = {
  // Exness Signature Palette
  brand: {
    yellow: '#FFDE00', // Exness primary gold/yellow
    yellowHover: '#E5C700',
    darkYellow: '#CBAF00',
    black: '#121214',
    darkGrey: '#181A20',
  },

  // Trading status colors
  trading: {
    buy: '#00B15D', // Exness Green / Up / Bullish
    buyLight: 'rgba(0, 177, 93, 0.12)',
    sell: '#F53649', // Exness Red / Down / Bearish
    sellLight: 'rgba(245, 54, 73, 0.12)',
  },

  // Dark Theme (Default for trading apps)
  dark: {
    background: '#0B0E14',
    card: '#161B26',
    surface: '#1E2330',
    surfaceSubtle: '#262D3D',
    border: '#282F3E',
    borderLight: '#1C2230',
    textPrimary: '#FFFFFF',
    textSecondary: '#8F9CAE',
    textMuted: '#5E6B7E',
    iconDefault: '#9AA7B9',
    accent: '#FFDE00',
    accentText: '#121214',
    divider: '#1E2432',
    inputBg: '#121620',
  },

  // Light Theme
  light: {
    background: '#F5F7FA',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSubtle: '#F0F2F5',
    border: '#E1E4EB',
    borderLight: '#EDF0F5',
    textPrimary: '#14171F',
    textSecondary: '#5E697A',
    textMuted: '#8E99A8',
    iconDefault: '#697586',
    accent: '#FFDE00',
    accentText: '#121214',
    divider: '#EBEFF5',
    inputBg: '#F8FAFC',
  },
};

export type ThemeMode = 'dark' | 'light';
