export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-production-api.com/api';

export const USER_TYPES = {
  PASSENGER: 'passenger',
  DRIVER: 'driver',
  HELPER: 'helper',
  AGENT: 'agent'
} as const;

export const COLORS = {
  // Go Bangladesh brand colors
  primary: '#4A90E2', // Go Bangladesh Blue
  secondary: '#FF8C42', // Go Bangladesh Orange
  accent: '#2E5BBA', // Darker blue for accents
  orange_light: '#FFB366', // Lighter orange for highlights
  
  // Status colors
  success: '#059669',
  error: '#dc2626',
  warning: '#d97706',
  info: '#0891b2',
  purple: '#7c3aed',
  white: '#ffffff',
  black: '#000000',
  
  // Gray scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },

  // Go Bangladesh specific gradients and variations
  brand: {
    blue: '#4A90E2',
    orange: '#FF8C42',
    blue_dark: '#2E5BBA',
    blue_light: '#7BB3F0',
    orange_dark: '#E6742A',
    orange_light: '#FFB366',
    background: '#F8FAFC',
    surface: '#FFFFFF'
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
  CARD_DATA: 'card_data',
  SELECTED_ORGANIZATION: 'selected_organization',
  SELECTED_BUS: 'selected_bus',
  DRIVER_HELPER_SESSION: 'driver_helper_session',
  AGENT_SESSION: 'agent_session'
};
