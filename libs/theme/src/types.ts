export interface ThemeTokens {
  // Semantic tokens (RGB triplet strings like "26 92 75")
  primary: string;
  primaryForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  popover: string;
  popoverForeground: string;

  // Brand hex colors
  brandPrimary: string;
  brandBackground: string;
  brandForeground: string;
  brandMutedForeground: string;
  brandWhite: string;

  // Bucket colors
  bucketMedia: string;
  bucketTasks: string;
  bucketLearning: string;
  bucketNotes: string;
}

export type SemanticToken = keyof Omit<
  ThemeTokens,
  | 'brandPrimary'
  | 'brandBackground'
  | 'brandForeground'
  | 'brandMutedForeground'
  | 'brandWhite'
  | 'bucketMedia'
  | 'bucketTasks'
  | 'bucketLearning'
  | 'bucketNotes'
>;
