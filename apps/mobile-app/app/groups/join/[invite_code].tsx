import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Spinner } from '@/components/ui/spinner';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useLocalization } from '@/context';
import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';
import { queryKeys } from '@kurate/query';

interface JoinError {
  title: string;
  description: string;
}

// base64-url-safe decode (matches web's `decodeEmail`)
function decodeEmail(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (padded.length % 4)) % 4;
  return atob(padded + '='.repeat(padding));
}

export default function JoinGroupScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { invite_code, e } = useLocalSearchParams<{
    invite_code: string;
    e?: string;
  }>();

  const userId = useAuthStore(state => state.userId);
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const isOnboardingCompleted = useAuthStore(
    state => state.isOnboardingCompleted,
  );

  const [error, setError] = useState<JoinError | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!invite_code || !userId) return;

      // Validate email-specific invite
      let invitedEmail: string | null = null;
      if (e) {
        try {
          invitedEmail = decodeEmail(e);
        } catch {
          if (!cancelled)
            setError({
              title: t('groups.join_invalid_title'),
              description: t('groups.join_invalid_desc'),
            });
          return;
        }

        const { data: userRes } = await supabase.auth.getUser();
        const currentEmail = userRes?.user?.email ?? null;
        if (currentEmail && currentEmail !== invitedEmail) {
          if (!cancelled)
            setError({
              title: t('groups.join_wrong_account_title'),
              description: t('groups.join_wrong_account_desc', {
                invitedEmail,
                currentEmail,
              }),
            });
          return;
        }

        const { data: inviteRow } = await supabase
          .from('group_invites')
          .select('id')
          .eq('group_id', invite_code)
          .eq('invited_email', invitedEmail)
          .maybeSingle();
        if (!inviteRow) {
          if (!cancelled)
            setError({
              title: t('groups.join_revoked_title'),
              description: t('groups.join_revoked_desc'),
            });
          return;
        }
      }

      const { data: group } = await supabase
        .from('conversations')
        .select('id, group_name, group_max_members')
        .eq('id', invite_code)
        .maybeSingle();

      if (!group) {
        if (!cancelled)
          setError({
            title: t('groups.join_invalid_title'),
            description: t('groups.join_invalid_desc'),
          });
        return;
      }

      const { data: existing } = await supabase
        .from('conversation_members')
        .select('id')
        .eq('convo_id', group.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        if (!cancelled) router.replace(`/groups/${group.id}` as never);
        return;
      }

      const max = group.group_max_members ?? 50;
      const { count } = await supabase
        .from('conversation_members')
        .select('id', { count: 'exact', head: true })
        .eq('convo_id', group.id);
      if ((count ?? 0) >= max) {
        if (!cancelled)
          setError({
            title: t('groups.join_full_title', {
              groupName: group.group_name ?? '',
            }),
            description: t('groups.join_full_desc', { max }),
          });
        return;
      }

      const { error: insertErr } = await supabase
        .from('conversation_members')
        .insert({
          convo_id: group.id,
          user_id: userId,
          role: 'member',
        });
      if (insertErr) {
        if (!cancelled)
          setError({
            title: t('groups.join_invalid_title'),
            description: insertErr.message,
          });
        return;
      }

      if (invitedEmail) {
        await supabase
          .from('group_invites')
          .delete()
          .eq('group_id', group.id)
          .eq('invited_email', invitedEmail);
        void queryClient.invalidateQueries({
          queryKey: queryKeys.groups.invites(group.id),
        });
      }

      void queryClient.invalidateQueries({
        queryKey: queryKeys.groups.list(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.groups.members(group.id),
      });

      if (!cancelled) router.replace(`/groups/${group.id}` as never);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [invite_code, e, userId, router, queryClient, t]);

  // Auth gates
  if (!invite_code) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ErrorView
          title={t('groups.join_invalid_title')}
          description={t('groups.join_invalid_desc')}
          onHome={() => router.replace('/(tabs)' as never)}
          homeLabel={t('groups.join_go_home')}
        />
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ErrorView
          title={t('groups.join_signin_required_title')}
          description={t('groups.join_signin_required_desc')}
          onHome={() => router.replace('/auth' as never)}
          homeLabel={t('groups.join_go_home')}
        />
      </SafeAreaView>
    );
  }

  if (!isOnboardingCompleted) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ErrorView
          title={t('groups.join_signin_required_title')}
          description={t('groups.join_signin_required_desc')}
          onHome={() => router.replace('/(onboarding)/onboarding' as never)}
          homeLabel={t('groups.join_go_home')}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ErrorView
          title={error.title}
          description={error.description}
          onHome={() => router.replace('/(tabs)' as never)}
          homeLabel={t('groups.join_go_home')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <VStack className="flex-1 items-center justify-center gap-4">
        <Spinner />
        <Text className="font-sans text-sm text-muted-foreground">
          {t('groups.join_validating')}
        </Text>
      </VStack>
    </SafeAreaView>
  );
}

interface ErrorViewProps {
  title: string;
  description: string;
  onHome: () => void;
  homeLabel: string;
}

function ErrorView({ title, description, onHome, homeLabel }: ErrorViewProps) {
  return (
    <VStack className="flex-1 items-center justify-center gap-4 px-6">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <Icon as={AlertCircle} size="md" className="text-destructive" />
      </View>
      <Text className="text-center font-sans text-base font-semibold text-foreground">
        {title}
      </Text>
      <Text className="text-center font-sans text-sm text-muted-foreground">
        {description}
      </Text>
      <Button onPress={onHome} className="mt-2">
        <ButtonText>{homeLabel}</ButtonText>
      </Button>
    </VStack>
  );
}
