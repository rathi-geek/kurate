import { useEffect, useState } from 'react';

import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';

export function useAuthSession() {
  const [isInitializing, setIsInitializing] = useState(true);
  const setSession = useAuthStore(state => state.setSession);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch(err => {
        console.error('[auth] getSession failed:', err);
      })
      .finally(() => {
        setIsInitializing(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return { isInitializing };
}
