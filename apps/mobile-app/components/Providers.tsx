import { useTheme } from '@/hooks';
import React, { PropsWithChildren } from 'react';
import { GluestackUIProvider } from './ui/gluestack-ui-provider';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { LocalizationProvider } from '@/context';

export const Providers = ({ children }: PropsWithChildren) => {
  const { theme, mode } = useTheme();
  return (
    <GluestackUIProvider mode={mode}>
      <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <LocalizationProvider>{children}</LocalizationProvider>
      </ThemeProvider>
    </GluestackUIProvider>
  );
};
