import { useTheme } from '@/hooks';
import React, { PropsWithChildren } from 'react';
import { ThemeVarsProvider } from './ui/theme-provider';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { LocalizationProvider } from '@/context';
import { QueryProvider } from './QueryProvider';

export const Providers = ({ children }: PropsWithChildren) => {
  const { theme, mode } = useTheme();
  return (
    <QueryProvider>
      <KeyboardProvider>
        <ThemeVarsProvider mode={mode}>
          <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
            <LocalizationProvider>{children}</LocalizationProvider>
          </ThemeProvider>
        </ThemeVarsProvider>
      </KeyboardProvider>
    </QueryProvider>
  );
};
