import {
  PlusJakartaSans_200ExtraLight,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

export const plusJakartaSansFonts = {
  PlusJakartaSans_200ExtraLight,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
};

export const FONT_WEIGHTS = {
  extraLight: 'PlusJakartaSans_200ExtraLight',
  light: 'PlusJakartaSans_300Light',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const FONT_SIZES = {
  xs: 12,    // was 10, now +2
  sm: 14,    // was 12, now +2
  base: 16,  // was 14, now +2
  md: 18,    // was 16, now +2
  lg: 20,    // was 18, now +2
  xl: 22,    // was 20, now +2
  '2xl': 26, // was 24, now +2
  '3xl': 30, // was 28, now +2
  '4xl': 34, // was 32, now +2
  '5xl': 38, // was 36, now +2
  '6xl': 50, // was 48, now +2
} as const;

// Typography scale for better mobile UX
export const TYPOGRAPHY = {
  // Headers
  h1: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: FONT_SIZES['4xl'],
    lineHeight: 44, // Increased to prevent descender cutoff
  },
  h2: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: FONT_SIZES['3xl'],
    lineHeight: 38, // Increased to prevent descender cutoff
  },
  h3: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: FONT_SIZES['2xl'],
    lineHeight: 34, // Increased to prevent descender cutoff
  },
  h4: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: FONT_SIZES.xl,
    lineHeight: 30, // Increased to prevent descender cutoff
  },
  h5: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: FONT_SIZES.lg,
    lineHeight: 28, // Increased to prevent descender cutoff
  },
  h6: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: FONT_SIZES.md,
    lineHeight: 26, // Increased to prevent descender cutoff
  },
  
  // Body text
  bodyLarge: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: FONT_SIZES.md,
    lineHeight: 26, // Increased to prevent descender cutoff
  },
  body: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: FONT_SIZES.base,
    lineHeight: 24, // Increased to prevent descender cutoff
  },
  bodySmall: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: FONT_SIZES.sm,
    lineHeight: 22, // Increased to prevent descender cutoff
  },
  
  // Labels and captions
  label: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: FONT_SIZES.base,
    lineHeight: 24, // Increased to prevent descender cutoff
  },
  labelSmall: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: FONT_SIZES.sm,
    lineHeight: 22, // Increased to prevent descender cutoff
  },
  caption: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: FONT_SIZES.xs,
    lineHeight: 20, // Increased to prevent descender cutoff
  },
  
  // Buttons
  button: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: FONT_SIZES.base,
    lineHeight: 24, // Increased to prevent descender cutoff
  },
  buttonLarge: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: FONT_SIZES.md,
    lineHeight: 26, // Increased to prevent descender cutoff
  },
  buttonSmall: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: FONT_SIZES.sm,
    lineHeight: 22, // Increased to prevent descender cutoff
  },
};
