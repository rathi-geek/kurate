import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kurate/query';

import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useLocalization } from '@/context';
import { supabase } from '@/libs/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useUserInterestsQuery } from '@/hooks/useUserInterestsQuery';
import { useUsernameAvailability } from '@/hooks/useUsernameAvailability';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { saveUserInterests } from '@/hooks/useUserInterests';
import { useAuthStore } from '@/store';
import { UsernameField } from '@/components/onboarding/username-field';
import { InterestPicker } from '@/components/onboarding/interest-picker';
import { AvatarUpload } from '@/components/profile/AvatarUpload';

const BIO_MAX_LENGTH = 300;

export default function ProfileEditScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const userId = useAuthStore(state => state.userId);
  const { data: profile, isLoading } = useProfile(userId ?? undefined);
  const { data: initialInterests = [] } = useUserInterestsQuery(
    userId ?? undefined,
  );
  const { uploading, pickAndUpload, deleteAvatar } = useAvatarUpload();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { status: handleStatus, setStatus: setHandleStatus } =
    useUsernameAvailability(username, profile?.handle ?? undefined);

  useEffect(() => {
    if (profile) {
      const displayName = [profile.firstName, profile.lastName]
        .filter(Boolean)
        .join(' ');
      setName(displayName);
      setUsername(profile.handle ?? '');
      setBio(profile.about ?? '');
      setAvatarUrl(profile.avatarUrl);
      setInterests(initialInterests);
    }
  }, [profile, initialInterests]);

  if (isLoading || !profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Spinner className="text-primary" />
      </SafeAreaView>
    );
  }

  function toggleInterest(interest: string) {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest],
    );
  }

  async function handlePickImage() {
    const url = await pickAndUpload(profile!.id);
    if (url) setAvatarUrl(url);
  }

  async function handleDeleteAvatar() {
    const deleted = await deleteAvatar(profile!.id, t);
    if (deleted) setAvatarUrl(null);
  }

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();

    let hasError = false;
    if (!trimmedName) {
      setNameError(t('profile.display_name') + ' required');
      hasError = true;
    }
    if (!trimmedUsername) {
      setUsernameError(t('profile.username') + ' required');
      hasError = true;
    }
    if (hasError) return;

    setSaving(true);
    const spaceIdx = trimmedName.indexOf(' ');
    const first_name =
      spaceIdx === -1 ? trimmedName : trimmedName.slice(0, spaceIdx);
    const last_name =
      spaceIdx === -1 ? null : trimmedName.slice(spaceIdx + 1) || null;

    const { error } = await supabase
      .from('profiles')
      .update({ first_name, last_name, handle: trimmedUsername, about: bio })
      .eq('id', profile!.id);

    if (error) {
      setSaving(false);
      return;
    }

    await saveUserInterests(profile!.id, interests);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.user.profile(profile!.id),
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.user.interests(profile!.id),
    });

    setSaving(false);
    router.back();
  }

  const canSave =
    name.trim().length > 0 &&
    username.trim().length > 0 &&
    !usernameError &&
    handleStatus !== 'taken' &&
    handleStatus !== 'checking';
  const busy = saving || uploading;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <HStack className="items-center justify-between border-b border-border px-6 py-4">
          <Text className="font-sans text-base font-semibold text-foreground">
            {t('profile.edit_title')}
          </Text>
          <Pressable onPress={() => router.back()} className="p-1">
            <X size={20} className="text-muted-foreground" />
          </Pressable>
        </HStack>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-5 gap-5"
          keyboardShouldPersistTaps="handled"
        >
          <AvatarUpload
            avatarUrl={avatarUrl}
            displayName={name}
            uploading={uploading}
            onPickImage={handlePickImage}
            onDeleteAvatar={handleDeleteAvatar}
          />

          <VStack className="gap-1">
            <Text className="mb-1 font-sans text-sm font-medium text-foreground">
              {t('profile.display_name')}
            </Text>
            <Input>
              <InputField
                placeholder={t('profile.display_name_placeholder')}
                value={name}
                onChangeText={v => {
                  setName(v);
                  setNameError(null);
                }}
                onBlur={() => {
                  if (!name.trim()) setNameError('Required');
                }}
              />
            </Input>
            {nameError ? (
              <Text className="mt-1 font-sans text-xs text-destructive">
                {nameError}
              </Text>
            ) : null}
          </VStack>

          <UsernameField
            username={username}
            onUsernameChange={setUsername}
            error={usernameError}
            onErrorChange={setUsernameError}
            status={handleStatus}
            onStatusReset={() => setHandleStatus('idle')}
          />

          <VStack className="gap-1">
            <Text className="mb-1 font-sans text-sm font-medium text-foreground">
              {t('profile.bio')}
            </Text>
            <Input className="min-h-[80px]">
              <InputField
                placeholder={t('profile.bio_placeholder')}
                value={bio}
                onChangeText={v => setBio(v.slice(0, BIO_MAX_LENGTH))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={BIO_MAX_LENGTH}
              />
            </Input>
            <Text className="mt-1 text-right font-sans text-xs text-muted-foreground">
              {t('profile.bio_char_count', { count: bio.length })}
            </Text>
          </VStack>

          <InterestPicker interests={interests} onToggle={toggleInterest} />
        </ScrollView>

        <HStack className="gap-3 border-t border-border px-6 py-4">
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => router.back()}
            disabled={busy}
          >
            <ButtonText>{t('common.cancel')}</ButtonText>
          </Button>
          <Button
            className="flex-1"
            onPress={handleSave}
            disabled={busy || !canSave}
          >
            <ButtonText>
              {saving ? t('profile.saving') : t('profile.save_changes')}
            </ButtonText>
          </Button>
        </HStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
