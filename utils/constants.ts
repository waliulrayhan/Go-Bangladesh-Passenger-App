export const API_BASE_URL = 'https://mhmahi-001-site1.qtempurl.com';

export const USER_TYPES = {
  PASSENGER: 'passenger'
} as const;

export const COLORS = {
  // Go Bangladesh brand colors (updated to match COLOUR.md)
  primary: '#4A90E2', // Go Bangladesh Blue
  secondary: '#FF8A00', // Go Bangladesh Orange (updated)
  accent: '#2E5C8A', // Darker blue for accents
  orange_light: '#FFAB4D', // Lighter orange for highlights
  
  // System colors (updated to match COLOUR.md)
  success: '#00C851',
  error: '#FF4444',
  warning: '#FF8800',
  info: '#4A90E2',
  purple: '#7c3aed',
  white: '#ffffff',
  black: '#000000',
  
  // Gray scale (updated to match COLOUR.md)
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D1D1D1',
    400: '#B8B8B8',
    500: '#8E8E8E',
    600: '#6B6B6B',
    700: '#4A4A4A',
    800: '#2D2D2D',
    900: '#1A1A1A'
  },

  // Go Bangladesh specific gradients and variations (updated)
  brand: {
    blue: '#4A90E2',
    orange: '#FF8A00',
    blue_dark: '#2E5C8A',
    blue_light: '#7BB3F0',
    blue_subtle: '#E8F2FF',
    orange_dark: '#CC6E00',
    orange_light: '#FFAB4D',
    orange_subtle: '#FFF4E6',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    section: '#F5F5F5'
  }
};

// Compact spacing for mobile-first design
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

// Border radius for consistent design
export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// Compact component sizes for mobile
export const SIZES = {
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
  },
  button: {
    sm: 36,
    md: 44,
    lg: 52,
  },
  input: {
    sm: 36,
    md: 44,
    lg: 52,
  },
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
    '2xl': 64,
  }
} as const;

export const STORAGE_KEYS = {
  USER_TYPE: 'user_type',
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  CARD_DATA: 'card_data'
};
