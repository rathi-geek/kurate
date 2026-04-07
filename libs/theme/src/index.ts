export { lightTheme, darkTheme } from './tokens';
export type { ThemeTokens, SemanticToken } from './types';
import type { ThemeTokens } from './types';

/** Convert an RGB triplet string "26 92 75" to hex "#1a5c4b" */
export function rgbToHex(rgb: string): string {
  const parts = rgb.split(' ').map(Number);
  return (
    '#' +
    parts
      .map(n => n.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Build a NativeWind `vars()` compatible object from theme tokens.
 * Maps semantic token keys to CSS variable names.
 */
export function toNativeWindVars(
  theme: ThemeTokens,
): Record<string, string> {
  const varMap: Record<string, string> = {
    primary: '--primary',
    primaryForeground: '--primary-foreground',
    background: '--background',
    foreground: '--foreground',
    card: '--card',
    cardForeground: '--card-foreground',
    secondary: '--secondary',
    secondaryForeground: '--secondary-foreground',
    muted: '--muted',
    mutedForeground: '--muted-foreground',
    accent: '--accent',
    accentForeground: '--accent-foreground',
    destructive: '--destructive',
    destructiveForeground: '--destructive-foreground',
    border: '--border',
    input: '--input',
    ring: '--ring',
    popover: '--popover',
    popoverForeground: '--popover-foreground',
  };

  const themeRecord = theme as unknown as Record<string, string>;
  const result: Record<string, string> = {};
  for (const [key, cssVar] of Object.entries(varMap)) {
    if (key in themeRecord) {
      result[cssVar] = themeRecord[key];
    }
  }
  return result;
}

/** Bucket colors map for React Native (where CSS vars don't work) */
export function getBucketColors(theme: ThemeTokens) {
  return {
    media: theme.bucketMedia,
    tasks: theme.bucketTasks,
    learning: theme.bucketLearning,
    notes: theme.bucketNotes,
  } as Record<string, string>;
}
