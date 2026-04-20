import { useState } from 'react';
import { validateUsername } from '@kurate/utils';

import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useLocalization } from '@/context';

import { useProfileUpsert } from '@/hooks/useProfileUpsert';
import { useUsernameAvailability } from '@/hooks/useUsernameAvailability';
import { UsernameField } from './username-field';
import { InterestPicker } from './interest-picker';

export function OnboardingForm() {
  const { t } = useLocalization();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [localUsernameError, setLocalUsernameError] = useState<string | null>(
    null,
  );

  const { status: handleStatus, setStatus: setHandleStatus } =
    useUsernameAvailability(username);
  const {
    submit,
    loading,
    usernameError: serverUsernameError,
    setUsernameError: setServerUsernameError,
  } = useProfileUpsert({ onHandleStatusChange: setHandleStatus });

  const usernameError = serverUsernameError ?? localUsernameError;

  const canSubmit =
    name.trim().length > 0 &&
    username.trim().length > 0 &&
    !validateUsername(username.trim()) &&
    handleStatus !== 'taken' &&
    handleStatus !== 'checking';

  async function handleSubmit() {
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();

    let hasError = false;
    if (!trimmedName) {
      setNameError(t('validation.name_required'));
      hasError = true;
    } else if (trimmedName.length > 50) {
      setNameError(t('validation.name_too_long', { max: 50 }));
      hasError = true;
    }
    if (!trimmedUsername) {
      setLocalUsernameError(t('validation.username_required'));
      hasError = true;
    } else {
      const err = validateUsername(trimmedUsername);
      if (err) {
        setLocalUsernameError(err);
        hasError = true;
      }
    }
    if (hasError) return;

    await submit({
      name: trimmedName,
      username: trimmedUsername,
      interests,
    });
  }

  function toggleInterest(interest: string) {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest],
    );
  }

  return (
    <VStack className="gap-6">
      <VStack className="mb-4 gap-2">
        <Text className="font-sans text-3xl font-bold text-foreground">
          {t('auth.onboarding.title')}
        </Text>
        <Text className="font-sans text-base text-muted-foreground">
          {t('auth.onboarding.subtitle')}
        </Text>
      </VStack>

      <VStack className="gap-1">
        <Text className="mb-1 font-sans text-sm font-medium text-foreground">
          {t('auth.onboarding.name_label')}
        </Text>
        <Input>
          <InputField
            placeholder={t('auth.onboarding.name_placeholder')}
            value={name}
            maxLength={50}
            onChangeText={v => {
              const filtered = v.replace(/[^a-zA-Z\s]/g, '');
              setName(filtered);
              setNameError(null);
            }}
            onBlur={() => {
              if (!name.trim()) setNameError(t('validation.name_required'));
            }}
            autoComplete="name"
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
        onUsernameChange={v => {
          setUsername(v);
          setServerUsernameError(null);
        }}
        error={usernameError}
        onErrorChange={setLocalUsernameError}
        status={handleStatus}
        onStatusReset={() => setHandleStatus('idle')}
      />

      <InterestPicker interests={interests} onToggle={toggleInterest} />

      <Button
        onPress={handleSubmit}
        disabled={loading || !canSubmit}
        className="mt-2"
      >
        {loading ? (
          <Spinner size="small" className="text-primary-foreground" />
        ) : (
          <ButtonText>{t('auth.onboarding.submit')}</ButtonText>
        )}
      </Button>
    </VStack>
  );
}
