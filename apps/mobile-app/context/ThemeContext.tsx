import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

export type ColorPalette = { [key in keyof typeof Colors.light]: string };

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  mode: ThemeMode;
  colors: ColorPalette;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  mode: 'system',
  colors: Colors.light,
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

  const colors = theme === 'dark' ? Colors.dark : Colors.light;

  const toggleTheme = () => {
    if (mode === 'system') return;

    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, mode, colors, setMode, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
