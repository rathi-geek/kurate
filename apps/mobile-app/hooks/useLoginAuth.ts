import { useState } from 'react';
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
  const [magicEmail, setMagicEmail] = useState('');
  const [magicStep, setMagicStep] = useState<MagicStep>('form');
  const [magicError, setMagicError] = useState('');
  const [magicLoading, setMagicLoading] = useState(false);

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
    magicEmail,
    setMagicEmail,
    magicStep,
    magicError,
    magicLoading,
    handleMagicLink,
    resetMagicLink,
  };
}
