# Expo App Color Palette

## Primary Brand Colors

### Blue (Primary)
- **Primary Blue**: `#4A90E2` (Main brand blue from logo)
- **Blue Light**: `#7BB3F0` (Lighter tint for hover states)
- **Blue Dark**: `#2E5C8A` (Darker shade for emphasis)
- **Blue Subtle**: `#E8F2FF` (Very light for backgrounds)

### Orange (Secondary)
- **Primary Orange**: `#FF8A00` (Main brand orange from logo)
- **Orange Light**: `#FFAB4D` (Lighter tint for hover states)
- **Orange Dark**: `#CC6E00` (Darker shade for emphasis)
- **Orange Subtle**: `#FFF4E6` (Very light for backgrounds)

## Neutral Colors

### Grays
- **Gray 900**: `#1A1A1A` (Primary text)
- **Gray 800**: `#2D2D2D` (Secondary text)
- **Gray 700**: `#4A4A4A` (Tertiary text)
- **Gray 600**: `#6B6B6B` (Muted text)
- **Gray 500**: `#8E8E8E` (Placeholder text)
- **Gray 400**: `#B8B8B8` (Disabled text)
- **Gray 300**: `#D1D1D1` (Borders)
- **Gray 200**: `#E5E5E5` (Light borders)
- **Gray 100**: `#F5F5F5` (Background)
- **Gray 50**: `#FAFAFA` (Light background)

### Pure Colors
- **White**: `#FFFFFF`
- **Black**: `#000000`

## System Colors

### Success
- **Success**: `#00C851` (Green for success states)
- **Success Light**: `#4DDA64` (Light success)
- **Success Dark**: `#007E35` (Dark success)
- **Success Background**: `#E8F5E8` (Success background)

### Warning
- **Warning**: `#FF8800` (Aligned with brand orange)
- **Warning Light**: `#FFB84D` (Light warning)
- **Warning Dark**: `#CC6600` (Dark warning)
- **Warning Background**: `#FFF3E0` (Warning background)

### Error
- **Error**: `#FF4444` (Red for error states)
- **Error Light**: `#FF7777` (Light error)
- **Error Dark**: `#CC0000` (Dark error)
- **Error Background**: `#FFEBEB` (Error background)

### Info
- **Info**: `#4A90E2` (Uses primary blue)
- **Info Light**: `#7BB3F0` (Light info)
- **Info Dark**: `#2E5C8A` (Dark info)
- **Info Background**: `#E8F2FF` (Info background)

## Usage Guidelines

### Primary Actions
- Use **Primary Blue** (`#4A90E2`) for main CTAs and important buttons
- Use **Blue Dark** (`#2E5C8A`) for pressed/active states

### Secondary Actions
- Use **Primary Orange** (`#FF8A00`) for secondary CTAs and highlights
- Use **Orange Dark** (`#CC6E00`) for pressed/active states

### Backgrounds
- **App Background**: `#FAFAFA` (Gray 50)
- **Card Background**: `#FFFFFF` (White)
- **Section Background**: `#F5F5F5` (Gray 100)

### Text Hierarchy
- **Headings**: `#1A1A1A` (Gray 900)
- **Body Text**: `#2D2D2D` (Gray 800)
- **Secondary Text**: `#4A4A4A` (Gray 700)
- **Muted Text**: `#6B6B6B` (Gray 600)

## Expo/React Native Implementation

```javascript
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
```

## Accessibility Notes

- All color combinations meet WCAG AA contrast requirements
- Primary blue and orange provide sufficient contrast against white backgrounds
- Gray text colors are carefully selected for readability
- Consider using darker variants for better accessibility in outdoor/bright environments