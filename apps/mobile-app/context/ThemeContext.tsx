import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '@kurate/theme';
import type { ThemeTokens } from '@kurate/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  mode: ThemeMode;
  tokens: ThemeTokens;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  mode: 'system',
  tokens: lightTheme,
  setMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  const resolvedTheme: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const [theme, setTheme] = useState<'light' | 'dark'>(resolvedTheme);

  useEffect(() => {
    setTheme(resolvedTheme);
  }, [resolvedTheme]);

  const tokens = theme === 'dark' ? darkTheme : lightTheme;

  const toggleTheme = () => {
    if (mode === 'system') return;
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, mode, tokens, setMode, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
