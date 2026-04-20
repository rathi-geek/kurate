import { useState } from 'react';

import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';
import { useLocalization } from '@/context';
import { saveUserInterests } from './useUserInterests';

import type { HandleStatus } from './useUsernameAvailability';

interface UseProfileUpsertOptions {
  onHandleStatusChange: (status: HandleStatus) => void;
}

export function useProfileUpsert({
  onHandleStatusChange,
}: UseProfileUpsertOptions) {
  const { t } = useLocalization();
  const setOnboardingCompleted = useAuthStore(
    state => state.setOnboardingCompleted,
  );
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  async function submit({
    name,
    username,
    interests,
  }: {
    name: string;
    username: string;
    interests: string[];
  }) {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setLoading(false);
      return;
    }

    const spaceIdx = name.indexOf(' ');
    const first_name = spaceIdx === -1 ? name : name.slice(0, spaceIdx);
    const last_name = spaceIdx === -1 ? null : name.slice(spaceIdx + 1) || null;

    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: user.id,
      first_name,
      last_name,
      handle: username,
      is_onboarded: true,
    });

    if (upsertError) {
      if (upsertError.code === '23505') {
        setUsernameError(t('validation.username_taken'));
        onHandleStatusChange('taken');
      } else if (upsertError.message?.includes('character varying')) {
        setUsernameError(t('validation.profile_field_too_long'));
      } else {
        setUsernameError(upsertError.message);
      }
      setLoading(false);
      return;
    }

    await supabase.auth.updateUser({ data: { is_onboarded: true } });

    try {
      await saveUserInterests(user.id, interests);
    } catch (err) {
      console.error('[onboarding] saveUserInterests failed:', err);
    }

    setOnboardingCompleted(true);
    setLoading(false);
  }

  return { submit, loading, usernameError, setUsernameError };
}
