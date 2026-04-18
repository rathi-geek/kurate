import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import { supabase } from '@/libs/supabase/client';

WebBrowser.maybeCompleteAuthSession();

export type MagicStep = 'form' | 'sent';

function extractTokensFromUrl(url: string) {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return null;

  const params = new URLSearchParams(url.slice(hashIndex + 1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function useLoginAuth() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');
  const [magicStep, setMagicStep] = useState<MagicStep>('form');
  const [magicError, setMagicError] = useState('');
  const [magicLoading, setMagicLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Linking.createURL('auth/callback'),
          skipBrowserRedirect: true,
        },
      });

      if (error || !data?.url) {
        console.error('[auth] signInWithOAuth failed:', error?.message);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        Linking.createURL('auth/callback'),
      );

      if (result.type === 'success' && result.url) {
        const tokens = extractTokensFromUrl(result.url);
        if (tokens) {
          await supabase.auth.setSession({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
          });
        }
      }
    } catch (err) {
      console.error('[auth] Google sign-in error:', err);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleApple() {
    setAppleLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        console.error('[auth] Apple sign-in returned no identity token');
        return;
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        console.error('[auth] Apple signInWithIdToken failed:', error.message);
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== 'ERR_REQUEST_CANCELED') {
        console.error('[auth] Apple sign-in error:', err);
      }
    } finally {
      setAppleLoading(false);
    }
  }

  async function handleMagicLink() {
    setMagicError('');
    setMagicLoading(true);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: { emailRedirectTo: Linking.createURL('auth/callback') },
    });

    if (otpError) {
      setMagicError(otpError.message);
      setMagicLoading(false);
      return;
    }

    setMagicStep('sent');
    setMagicLoading(false);
  }

  function resetMagicLink() {
    setMagicStep('form');
    setMagicEmail('');
    setMagicError('');
  }

  return {
    googleLoading,
    handleGoogle,
    appleLoading,
    appleAvailable,
    handleApple,
    magicEmail,
    setMagicEmail,
    magicStep,
    magicError,
    magicLoading,
    handleMagicLink,
    resetMagicLink,
  };
}
