import { useTheme } from '@/hooks';
import React, { PropsWithChildren } from 'react';
import { GluestackUIProvider } from './ui/gluestack-ui-provider';
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
        <GluestackUIProvider mode={mode}>
          <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
            <LocalizationProvider>{children}</LocalizationProvider>
          </ThemeProvider>
        </GluestackUIProvider>
      </KeyboardProvider>
    </QueryProvider>
  );
};
