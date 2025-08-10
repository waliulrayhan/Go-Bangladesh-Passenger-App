export const API_BASE_URL = 'https://thegobd.com';

export const USER_TYPES = {
  PASSENGER: 'passenger'
} as const;

export const COLORS = {
  // Brand colors
  primary: '#4A90E2', // Go Bangladesh Blue
  secondary: '#FF8A00', // Go Bangladesh Orange
  accent: '#1E40AF', // Deep navy for accents
  orange_light: '#FDBA74', // Warm light orange

  // System status colors (accessible)
  success: '#16A34A', // Accessible green
  error: '#DC2626',   // Deep, clear red
  warning: '#D97706', // Rich amber
  info: '#0EA5E9',    // Fresh cyan-blue
  purple: '#8B5CF6',
  white: '#FFFFFF',
  black: '#000000',

  // Grayscale (modern, consistent)
  gray: {
    50:  '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B'
  },

  // Brand variations & UI backgrounds
  brand: {
    blue: '#4A90E2',
    orange: '#FF8A00',
    blue_dark: '#1E40AF',
    blue_light: '#60A5FA',
    blue_subtle: '#EFF6FF',
    orange_dark: '#C2410C',
    orange_light: '#FDBA74',
    orange_subtle: '#FFF7ED',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    section: '#F9FAFB'
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

// Component sizes for mobile
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
  REGISTRATION_COMPLETE: 'registration_complete'
};
