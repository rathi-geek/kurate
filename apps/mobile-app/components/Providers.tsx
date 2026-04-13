import { useTheme } from '@/hooks';
import React, { PropsWithChildren } from 'react';
import { ThemeVarsProvider } from './ui/theme-provider';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { LocalizationProvider } from '@/context';
import { QueryProvider } from './QueryProvider';

export const Providers = ({ children }: PropsWithChildren) => {
  const { theme, mode } = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <KeyboardProvider>
          <ThemeVarsProvider mode={mode}>
            <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
              <LocalizationProvider>
                <BottomSheetModalProvider>
                  {children}
                  <Toast />
                </BottomSheetModalProvider>
              </LocalizationProvider>
            </ThemeProvider>
          </ThemeVarsProvider>
        </KeyboardProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
};
