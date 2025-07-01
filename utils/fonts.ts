import {
  Outfit_100Thin,
  Outfit_200ExtraLight,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
} from '@expo-google-fonts/outfit';

export const outfitFonts = {
  Outfit_100Thin,
  Outfit_200ExtraLight,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
};

export const FONT_WEIGHTS = {
  thin: 'Outfit_100Thin',
  extraLight: 'Outfit_200ExtraLight',
  light: 'Outfit_300Light',
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semiBold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  extraBold: 'Outfit_800ExtraBold',
  black: 'Outfit_900Black',
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
    fontFamily: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES['4xl'],
    lineHeight: 40, // was 38, now +2
  },
  h2: {
    fontFamily: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES['3xl'],
    lineHeight: 36, // was 34, now +2
  },
  h3: {
    fontFamily: FONT_WEIGHTS.semiBold,
    fontSize: FONT_SIZES['2xl'],
    lineHeight: 32, // was 30, now +2
  },
  h4: {
    fontFamily: FONT_WEIGHTS.semiBold,
    fontSize: FONT_SIZES.xl,
    lineHeight: 28, // was 26, now +2
  },
  h5: {
    fontFamily: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.lg,
    lineHeight: 26, // was 24, now +2
  },
  h6: {
    fontFamily: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.md,
    lineHeight: 24, // was 22, now +2
  },
  
  // Body text
  bodyLarge: {
    fontFamily: FONT_WEIGHTS.regular,
    fontSize: FONT_SIZES.md,
    lineHeight: 24, // was 22, now +2
  },
  body: {
    fontFamily: FONT_WEIGHTS.regular,
    fontSize: FONT_SIZES.base,
    lineHeight: 22, // was 20, now +2
  },
  bodySmall: {
    fontFamily: FONT_WEIGHTS.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20, // was 18, now +2
  },
  
  // Labels and captions
  label: {
    fontFamily: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.base,
    lineHeight: 22, // was 20, now +2
  },
  labelSmall: {
    fontFamily: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20, // was 18, now +2
  },
  caption: {
    fontFamily: FONT_WEIGHTS.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 18, // was 16, now +2
  },
  
  // Buttons
  button: {
    fontFamily: FONT_WEIGHTS.semiBold,
    fontSize: FONT_SIZES.base,
    lineHeight: 22, // was 20, now +2
  },
  buttonLarge: {
    fontFamily: FONT_WEIGHTS.semiBold,
    fontSize: FONT_SIZES.md,
    lineHeight: 24, // was 22, now +2
  },
  buttonSmall: {
    fontFamily: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20, // was 18, now +2
  },
};
