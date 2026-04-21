import type { ThemeTokens } from './types';

/**
 * Light theme tokens — single source of truth for both web and mobile.
 *
 * Semantic tokens use RGB triplet strings (e.g. "26 92 75") so they work with
 * both CSS `rgb(var(--primary) / <alpha>)` and NativeWind `vars()`.
 *
 * Brand/hex tokens are full hex strings for direct use in JS (tab bars,
 * splash screens, icon colors, etc.) where className isn't available.
 */
export const lightTheme: ThemeTokens = {
  // Semantic tokens (RGB triplets)
  primary: '26 92 75',
  primaryForeground: '255 255 255',
  background: '245 240 232',
  foreground: '43 91 126',
  card: '255 255 255',
  cardForeground: '43 91 126',
  secondary: '250 247 242',
  secondaryForeground: '43 91 126',
  muted: '250 247 242',
  mutedForeground: '91 125 153',
  accent: '234 243 239',
  accentForeground: '26 92 75',
  destructive: '185 28 28',
  destructiveForeground: '255 255 255',
  border: '220 227 234',
  input: '220 227 234',
  ring: '26 92 75',
  popover: '255 255 255',
  popoverForeground: '43 91 126',

  // Brand hex colors (for non-className usage)
  brandPrimary: '#1a5c4b',
  brandBackground: '#f5f0e8',
  brandForeground: '#2b5b7e',
  brandMutedForeground: '#5b7d99',
  brandWhite: '#ffffff',
  brandDestructive: '#b91c1c',
  brandWarningForeground: '#78350f',

  // Bucket colors
  bucketMedia: '#FDF2F8',
  bucketTasks: '#D1FAE5',
  bucketLearning: '#EFF6FF',
  bucketNotes: '#FEF3C7',
};

export const darkTheme: ThemeTokens = {
  primary: '255 245 245',
  primaryForeground: '23 23 23',
  background: '10 10 10',
  foreground: '250 250 250',
  card: '23 23 23',
  cardForeground: '250 250 250',
  secondary: '38 38 38',
  secondaryForeground: '250 250 250',
  muted: '38 38 38',
  mutedForeground: '161 161 161',
  accent: '38 38 38',
  accentForeground: '250 250 250',
  destructive: '255 100 103',
  destructiveForeground: '255 255 255',
  border: '46 46 46',
  input: '46 46 46',
  ring: '115 115 115',
  popover: '23 23 23',
  popoverForeground: '250 250 250',

  brandPrimary: '#1a5c4b',
  brandBackground: '#0a0a0a',
  brandForeground: '#fafafa',
  brandMutedForeground: '#a1a1a1',
  brandWhite: '#ffffff',
  brandDestructive: '#b91c1c',
  brandWarningForeground: '#78350f',

  bucketMedia: '#FDF2F8',
  bucketTasks: '#D1FAE5',
  bucketLearning: '#EFF6FF',
  bucketNotes: '#FEF3C7',
};
