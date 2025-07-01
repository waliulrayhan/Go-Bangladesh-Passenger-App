/**
 * Go Bangladesh Brand Colors
 * 
 * This file contains the complete color palette matching the brand logo
 * and COLOUR.md specifications. Import this file instead of using hardcoded colors.
 */

export const colors = {
  primary: {
    blue: '#4A90E2',
    blueLight: '#7BB3F0',
    blueDark: '#2E5C8A',
    blueSubtle: '#E8F2FF',
    orange: '#FF8A00',
    orangeLight: '#FFAB4D',
    orangeDark: '#CC6E00',
    orangeSubtle: '#FFF4E6',
  },
  neutral: {
    gray900: '#1A1A1A',
    gray800: '#2D2D2D',
    gray700: '#4A4A4A',
    gray600: '#6B6B6B',
    gray500: '#8E8E8E',
    gray400: '#B8B8B8',
    gray300: '#D1D1D1',
    gray200: '#E5E5E5',
    gray100: '#F5F5F5',
    gray50: '#FAFAFA',
    white: '#FFFFFF',
    black: '#000000',
  },
  system: {
    success: '#00C851',
    successLight: '#4DDA64',
    successDark: '#007E35',
    successBg: '#E8F5E8',
    warning: '#FF8800',
    warningLight: '#FFB84D',
    warningDark: '#CC6600',
    warningBg: '#FFF3E0',
    error: '#FF4444',
    errorLight: '#FF7777',
    errorDark: '#CC0000',
    errorBg: '#FFEBEB',
    info: '#4A90E2',
    infoLight: '#7BB3F0',
    infoDark: '#2E5C8A',
    infoBg: '#E8F2FF',
  },
};

// Backward compatibility with existing COLORS constant
export const COLORS_BRAND = {
  // Primary brand colors
  primary: colors.primary.blue,
  secondary: colors.primary.orange,
  accent: colors.primary.blueDark,
  
  // System colors
  success: colors.system.success,
  error: colors.system.error,
  warning: colors.system.warning,
  info: colors.system.info,
  white: colors.neutral.white,
  black: colors.neutral.black,
  
  // Gray scale
  gray: {
    50: colors.neutral.gray50,
    100: colors.neutral.gray100,
    200: colors.neutral.gray200,
    300: colors.neutral.gray300,
    400: colors.neutral.gray400,
    500: colors.neutral.gray500,
    600: colors.neutral.gray600,
    700: colors.neutral.gray700,
    800: colors.neutral.gray800,
    900: colors.neutral.gray900,
  },

  // Brand variations
  brand: {
    blue: colors.primary.blue,
    orange: colors.primary.orange,
    blue_dark: colors.primary.blueDark,
    blue_light: colors.primary.blueLight,
    blue_subtle: colors.primary.blueSubtle,
    orange_dark: colors.primary.orangeDark,
    orange_light: colors.primary.orangeLight,
    orange_subtle: colors.primary.orangeSubtle,
    background: colors.neutral.gray50,
    surface: colors.neutral.white,
    section: colors.neutral.gray100,
  }
};

// Usage guidelines (matching COLOUR.md)
export const colorUsage = {
  backgrounds: {
    app: colors.neutral.gray50,        // #FAFAFA (Gray 50)
    card: colors.neutral.white,        // #FFFFFF (White)
    section: colors.neutral.gray100,   // #F5F5F5 (Gray 100)
  },
  text: {
    headings: colors.neutral.gray900,     // #1A1A1A (Gray 900)
    body: colors.neutral.gray800,         // #2D2D2D (Gray 800)
    secondary: colors.neutral.gray700,    // #4A4A4A (Gray 700)
    muted: colors.neutral.gray600,        // #6B6B6B (Gray 600)
    placeholder: colors.neutral.gray500,  // #8E8E8E (Gray 500)
    disabled: colors.neutral.gray400,     // #B8B8B8 (Gray 400)
    inverse: colors.neutral.white,        // #FFFFFF (White)
  },
  buttons: {
    primary: {
      background: colors.primary.blue,     // #4A90E2
      text: colors.neutral.white,
      hover: colors.primary.blueDark,      // #2E5C8A
    },
    secondary: {
      background: colors.primary.orange,   // #FF8A00
      text: colors.neutral.white,
      hover: colors.primary.orangeDark,    // #CC6E00
    },
  },
};

export default colors;
