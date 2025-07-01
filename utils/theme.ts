/**
 * Go Bangladesh Brand Colors and Theme Configuration
 * 
 * This file contains the official Go Bangladesh color palette
 * based on the logo design with blue and orange as primary colors.
 */

export const GoBangladeshTheme = {
  colors: {
    // Primary brand colors from logo
    primary: '#4A90E2',      // Go Bangladesh Blue
    secondary: '#FF8C42',    // Go Bangladesh Orange
    
    // Extended blue palette
    blue: {
      light: '#7BB3F0',
      main: '#4A90E2',
      dark: '#2E5BBA',
      darker: '#1E3A7A',
    },
    
    // Extended orange palette
    orange: {
      light: '#FFB366',
      main: '#FF8C42',
      dark: '#E6742A',
      darker: '#CC5A15',
    },
    
    // Neutral colors
    background: '#F8FAFC',
    surface: '#FFFFFF',
    
    // Status colors
    success: '#059669',
    error: '#dc2626',
    warning: '#d97706',
    info: '#0891b2',
    
    // Text colors
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      inverse: '#FFFFFF',
    },
    
    // Border colors
    border: {
      light: '#F3F4F6',
      main: '#E5E7EB',
      dark: '#D1D5DB',
    }
  },
  
  // Component-specific color variations
  components: {
    button: {
      primary: {
        background: '#4A90E2',
        text: '#FFFFFF',
        border: '#4A90E2',
      },
      secondary: {
        background: '#FF8C42',
        text: '#FFFFFF',
        border: '#FF8C42',
      },
      outline: {
        background: 'transparent',
        text: '#4A90E2',
        border: '#4A90E2',
      }
    },
    header: {
      background: '#4A90E2',
      text: '#FFFFFF',
    },
    tabBar: {
      active: '#4A90E2',
      inactive: '#6B7280',
      background: '#FFFFFF',
    }
  },
  
  // Gradients for special effects
  gradients: {
    primary: ['#4A90E2', '#2E5BBA'],
    secondary: ['#FF8C42', '#E6742A'],
    background: ['#F8FAFC', '#FFFFFF'],
  }
};
