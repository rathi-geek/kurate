import { useEffect } from 'react';
import * as Linking from 'expo-linking';

import { supabase } from '@/libs/supabase/client';

function extractTokensFromUrl(url: string) {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return null;

  const params = new URLSearchParams(url.slice(hashIndex + 1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function useDeepLinkAuth() {
  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      const tokens = extractTokensFromUrl(url);
      if (tokens) {
        supabase.auth.setSession({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);

    // Handle the URL that opened the app (cold start)
    Linking.getInitialURL().then(url => {
      if (url) handleUrl({ url });
    });

    return () => subscription.remove();
  }, []);
}
