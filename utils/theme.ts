/**
 * Go Bangladesh Brand Colors and Theme Configuration
 * 
 * This file contains the official Go Bangladesh color palette
 * based on the logo design with blue and orange as primary colors.
 * Updated to match the exact brand specifications from COLOUR.md
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

export const GoBangladeshTheme = {
  colors: {
    // Primary brand colors from logo (updated to match COLOUR.md)
    primary: '#4A90E2',      // Go Bangladesh Blue
    secondary: '#FF8A00',    // Go Bangladesh Orange (updated)
    
    // Extended blue palette
    blue: {
      light: '#7BB3F0',
      main: '#4A90E2',
      dark: '#2E5C8A',
      subtle: '#E8F2FF',
    },
    
    // Extended orange palette
    orange: {
      light: '#FFAB4D',
      main: '#FF8A00',
      dark: '#CC6E00',
      subtle: '#FFF4E6',
    },
    
    // Neutral colors (updated to match COLOUR.md)
    background: '#FAFAFA',    // Gray 50
    surface: '#FFFFFF',       // White
    section: '#F5F5F5',       // Gray 100
    
    // System colors (updated to match COLOUR.md)
    success: '#00C851',
    error: '#FF4444',
    warning: '#FF8800',
    info: '#4A90E2',
    
    // Text colors (updated to match COLOUR.md)
    text: {
      primary: '#1A1A1A',     // Gray 900
      secondary: '#2D2D2D',   // Gray 800
      tertiary: '#4A4A4A',    // Gray 700
      muted: '#6B6B6B',       // Gray 600
      placeholder: '#8E8E8E', // Gray 500
      disabled: '#B8B8B8',    // Gray 400
      inverse: '#FFFFFF',
    },
    
    // Border colors (updated to match COLOUR.md)
    border: {
      light: '#E5E5E5',       // Gray 200
      main: '#D1D1D1',        // Gray 300
      dark: '#B8B8B8',        // Gray 400
    }
  },
  
  
  // Component-specific color variations (updated to match COLOUR.md)
  components: {
    button: {
      primary: {
        background: '#4A90E2',
        text: '#FFFFFF',
        border: '#4A90E2',
        hover: '#2E5C8A',
      },
      secondary: {
        background: '#FF8A00',
        text: '#FFFFFF',
        border: '#FF8A00',
        hover: '#CC6E00',
      },
      outline: {
        background: 'transparent',
        text: '#4A90E2',
        border: '#4A90E2',
        hover: '#E8F2FF',
      },
      success: {
        background: '#00C851',
        text: '#FFFFFF',
        border: '#00C851',
        hover: '#007E35',
      },
      error: {
        background: '#FF4444',
        text: '#FFFFFF',
        border: '#FF4444',
        hover: '#CC0000',
      },
      warning: {
        background: '#FF8800',
        text: '#FFFFFF',
        border: '#FF8800',
        hover: '#CC6600',
      }
    },
    header: {
      background: '#4A90E2',
      text: '#FFFFFF',
    },
    tabBar: {
      active: '#4A90E2',
      inactive: '#6B6B6B',
      background: '#FFFFFF',
      border: '#E5E5E5',
    },
    card: {
      background: '#FFFFFF',
      border: '#E5E5E5',
      shadow: '#1A1A1A',
    },
    input: {
      background: '#FFFFFF',
      border: '#D1D1D1',
      borderFocus: '#4A90E2',
      text: '#1A1A1A',
      placeholder: '#8E8E8E',
    }
  },
  
  // Gradients for special effects (updated)
  gradients: {
    primary: ['#4A90E2', '#2E5C8A'],
    secondary: ['#FF8A00', '#CC6E00'],
    background: ['#FAFAFA', '#FFFFFF'],
    success: ['#00C851', '#007E35'],
    error: ['#FF4444', '#CC0000'],
  }
};
