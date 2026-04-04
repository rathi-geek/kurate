import { useEffect, useState } from 'react';
import { validateUsername } from '@kurate/utils';

import { supabase } from '@/libs/supabase/client';

export type HandleStatus = 'idle' | 'checking' | 'available' | 'taken';

export function useUsernameAvailability(username: string) {
  const [status, setStatus] = useState<HandleStatus>('idle');

  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed || validateUsername(trimmed) !== null) {
      setStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      setStatus('checking');
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('handle', trimmed)
        .maybeSingle();
      setStatus(data ? 'taken' : 'available');
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  return { status, setStatus };
}
