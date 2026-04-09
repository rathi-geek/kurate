import { useRouter } from 'expo-router';

import { Spinner } from '@/components/ui/spinner';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { ProfileView } from '@/components/profile/ProfileView';
import { useProfile } from '@/hooks/useProfile';
import { useUserInterestsQuery } from '@/hooks/useUserInterestsQuery';
import { useAuthStore } from '@/store';

export default function ProfileScreen() {
  const router = useRouter();
  const userId = useAuthStore(state => state.userId);
  const { data: profile, isLoading, error } = useProfile(userId ?? undefined);
  const { data: interests = [] } = useUserInterestsQuery(userId ?? undefined);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner className="text-primary" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-8">
        <Text className="text-center font-sans text-base text-muted-foreground">
          {error?.message ?? 'Could not load profile'}
        </Text>
      </View>
    );
  }

  return (
    <ProfileView
      profile={profile}
      interests={interests}
      onEditPress={() => router.push('/profile-edit')}
    />
  );
}
