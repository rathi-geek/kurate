// THIS FILE IS AUTO-GENERATED. DO NOT EDIT.
// To update, edit constants/tokens.js and run 'pnpm generate:ts'

export const sizeConfig = {
  // ===== Breakpoints / Responsive =====
  breakpoints: {
    xs: 475,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  } as const,

  tabletBreakpoint: 768,

  tabletScale: 1.2,
  tabletFontScale: 1.15,
  tabletSpacingScale: 1.25,

  baseSpacing: 4,
  baseFontSize: 16,

  // ===== Typography =====
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
    '8xl': 96,
    '9xl': 128,
  } as const,

  lineHeights: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
    '4xl': 40,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
    '8xl': 96,
    '9xl': 128,
  } as const,

  fontWeights: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
    extrablack: 950,
  } as const,

  fontFamilies: {
    mono: ['SpaceMono'],
    default: ['SpaceMono'],
  } as const,

  // ===== Spacing =====
  spacing: {
    '0': 0,
    '1': 4,
    '2': 8,
    '3': 12,
    '4': 16,
    '5': 20,
    '6': 24,
    '7': 28,
    '8': 32,
    '9': 36,
    '10': 40,
    '11': 44,
    '12': 48,
    '14': 56,
    '16': 64,
    '20': 80,
    '24': 96,
    '28': 112,
    '32': 128,
    '36': 144,
    '40': 160,
    '44': 176,
    '48': 192,
    '52': 208,
    '56': 224,
    '60': 240,
    '64': 256,
    '72': 288,
    '80': 320,
    '96': 384,
    px: 1,
    '0.5': 2,
    '1.5': 6,
    '2.5': 10,
    '3.5': 14,
    '4.5': 18,
  } as const,

  // ===== Border =====
  borderRadius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    '3xl': 24,
    full: 9999,
    DEFAULT: 4,
  } as const,

  borderWidth: {
    '0': 0,
    '2': 2,
    '4': 4,
    '8': 8,
    DEFAULT: 1,
  } as const,
} as const;

// ===== Types (for convenience) =====
export type SpacingKeys = keyof typeof sizeConfig.spacing;
export type SpacingValues = (typeof sizeConfig.spacing)[SpacingKeys];
export type SpacingMap = {
  [K in SpacingKeys]: (typeof sizeConfig.spacing)[K];
};
export type FontSizeKeys = keyof typeof sizeConfig.fontSizes;
export type FontSizeValues = (typeof sizeConfig.fontSizes)[FontSizeKeys];
export type LineHeightKeys = keyof typeof sizeConfig.lineHeights;
export type LineHeightValues = (typeof sizeConfig.lineHeights)[LineHeightKeys];
export type BorderWidthKeys = keyof typeof sizeConfig.borderWidth;
export type BorderWidthValues =
  (typeof sizeConfig.borderWidth)[BorderWidthKeys];
export type BreakpointKeys = keyof typeof sizeConfig.breakpoints;
export type BreakpointValues = (typeof sizeConfig.breakpoints)[BreakpointKeys];
export type FontWeightKeys = keyof typeof sizeConfig.fontWeights;
export type FontFamilyKeys = keyof typeof sizeConfig.fontFamilies;
