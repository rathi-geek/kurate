import { useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Prevents double-navigation from rapid taps. Wraps `router.push` with a
 * ref-based lock that auto-resets when the screen regains focus (i.e. user
 * navigated back).
 */
export function useNavigationLock() {
  const router = useRouter();
  const locked = useRef(false);

  useFocusEffect(
    useCallback(() => {
      locked.current = false;
    }, []),
  );

  const push = useCallback(
    (path: string) => {
      if (locked.current) return;
      locked.current = true;
      router.push(path as never);
    },
    [router],
  );

  return { push, replace: router.replace, back: router.back };
}
