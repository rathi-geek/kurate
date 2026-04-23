import { useCallback } from 'react';
import { Alert, Image, ScrollView } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { useProfileCounts } from '@kurate/hooks';

import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalization } from '@/context';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';

import type { ProfileData } from '@/hooks/useProfile';

const DASH = '\u2014';

interface ProfileViewProps {
  profile: ProfileData;
  interests: string[];
  onEditPress: () => void;
}

function ProfileStats({ userId }: { userId: string }) {
  const { t } = useLocalization();
  const { data: counts } = useProfileCounts({ supabase, userId });

  const stats = [
    { key: 'stat_saved', value: counts ? counts.saved : DASH },
    { key: 'stat_read', value: counts ? counts.read : DASH },
    { key: 'stat_shared', value: counts ? counts.shared : DASH },
    { key: 'stat_following', value: DASH },
    { key: 'stat_trust_score', value: DASH },
  ];

  return (
    <HStack className="gap-1.5 px-4">
      {stats.map(stat => (
        <View
          key={stat.key}
          className="flex-1 items-center justify-center rounded-xl border border-border bg-card px-1 py-3"
        >
          <Text className="font-sans text-lg font-bold text-foreground">
            {stat.value}
          </Text>
          <Text
            className="mt-0.5 text-center font-mono uppercase text-muted-foreground"
            style={{ fontSize: 8 }}
            numberOfLines={1}
          >
            {t(`profile.${stat.key}`)}
          </Text>
        </View>
      ))}
    </HStack>
  );
}

export function ProfileView({
  profile,
  interests,
  onEditPress,
}: ProfileViewProps) {
  const { t } = useLocalization();
  const { tokens } = useTheme();
  const reset = useAuthStore(state => state.reset);

  const displayName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(' ');
  const avatarLetter = displayName ? displayName[0].toUpperCase() : '?';

  const handleLogout = useCallback(() => {
    Alert.alert(
      t('profile.confirm_logout_title'),
      t('profile.confirm_logout_desc'),
      [
        { text: t('profile.confirm_logout_cancel'), style: 'cancel' },
        {
          text: t('profile.confirm_logout_confirm'),
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            reset();
          },
        },
      ],
    );
  }, [t, reset]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <Text className="px-6 pb-4 pt-6 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('profile.title')}
        </Text>

        <HStack className="items-start gap-4 px-6 pb-6">
          <View className="h-16 w-16 overflow-hidden rounded-full bg-primary">
            {profile.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                className="h-full w-full rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="flex h-full w-full items-center justify-center">
                <Text className="font-sans text-2xl font-bold text-primary-foreground">
                  {avatarLetter}
                </Text>
              </View>
            )}
          </View>

          <VStack className="flex-1 gap-1">
            <HStack className="items-center gap-3">
              <Text className="font-sans text-2xl font-bold text-foreground">
                {displayName || DASH}
              </Text>
              <Pressable
                onPress={onEditPress}
                className="rounded-full border border-border px-3 py-1.5"
              >
                <Text className="font-sans text-xs text-foreground">
                  {t('profile.edit_btn')}
                </Text>
              </Pressable>
            </HStack>

            {profile.handle ? (
              <Text className="font-mono text-sm text-muted-foreground">
                @{profile.handle}
              </Text>
            ) : null}

            {profile.about ? (
              <Text className="mt-1 font-sans text-sm leading-relaxed text-muted-foreground">
                {profile.about}
              </Text>
            ) : null}

            {interests.length > 0 ? (
              <HStack className="mt-2 flex-wrap gap-2">
                {interests.map(tag => (
                  <View
                    key={tag}
                    className="rounded-full bg-secondary px-2 py-1"
                  >
                    <Text className="font-sans text-xs text-secondary-foreground">
                      {tag}
                    </Text>
                  </View>
                ))}
              </HStack>
            ) : null}
          </VStack>
        </HStack>

        <ProfileStats userId={profile.id} />
      </ScrollView>

      <View className=" border-border px-6 ">
        <Pressable
          onPress={handleLogout}
          className="flex-row items-center justify-center gap-2 rounded-[10px] border border-destructive/30 bg-destructive/5 px-4 py-2.5"
        >
          <LogOut size={16} color={`rgb(${tokens.destructive})`} />
          <Text className="font-sans text-sm font-medium text-destructive">
            {t('profile.logout')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
