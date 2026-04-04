import '@/global.css';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-reanimated';
import { ThemeProvider as AppThemeProvider } from '@/context';
import { Providers } from '@/components/Providers';
import { AnimatedSplash } from '@/components/AnimatedSplash';
import { useFCM } from '@/hooks';
import { useAuthStore } from '@/store';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useDeepLinkAuth } from '@/hooks/useDeepLinkAuth';
import { StatusBar } from 'expo-status-bar';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFCM();
  const { isInitializing } = useAuthSession();
  useDeepLinkAuth();
  const [showSplash, setShowSplash] = useState(true);

  const [loaded, error] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMMono_400Regular,
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && !isInitializing) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isInitializing]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (!loaded || isInitializing) {
    return null;
  }

  return (
    <AppThemeProvider>
      <Providers>
        <StatusBar style="auto" />
        <RootLayoutNav />
        {showSplash && <AnimatedSplash onFinish={handleSplashFinish} />}
      </Providers>
    </AppThemeProvider>
  );
}

function RootLayoutNav() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const isOnboardingCompleted = useAuthStore(
    state => state.isOnboardingCompleted,
  );

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isLoggedIn && isOnboardingCompleted}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={isLoggedIn && !isOnboardingCompleted}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="auth" />
      </Stack.Protected>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}
