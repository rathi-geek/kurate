import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useLocalization } from '@/context';
import { validateUsername } from '@kurate/utils';

import type { HandleStatus } from '@/hooks/useUsernameAvailability';

interface UsernameFieldProps {
  username: string;
  onUsernameChange: (value: string) => void;
  error: string | null;
  onErrorChange: (error: string | null) => void;
  status: HandleStatus;
  onStatusReset: () => void;
}

export function UsernameField({
  username,
  onUsernameChange,
  error,
  onErrorChange,
  status,
  onStatusReset,
}: UsernameFieldProps) {
  const { t } = useLocalization();

  return (
    <VStack className="gap-1">
      <Text className="mb-1 font-sans text-sm font-medium text-foreground">
        {t('auth.onboarding.username_label')}
      </Text>
      <Input>
        <InputField
          placeholder={t('auth.onboarding.username_placeholder')}
          maxLength={20}
          value={username}
          onChangeText={v => {
            const cleaned = v.toLowerCase().replace(/\s/g, '');
            onUsernameChange(cleaned);
            onErrorChange(cleaned ? (validateUsername(cleaned) ?? null) : null);
            onStatusReset();
          }}
          onBlur={() => {
            const v = username.trim();
            onErrorChange(v ? (validateUsername(v) ?? null) : t('validation.username_required'));
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Input>
      {error ? (
        <Text className="mt-1 font-sans text-xs text-destructive">{error}</Text>
      ) : null}
      {!error && status === 'checking' ? (
        <Text className="mt-1 font-sans text-xs text-muted-foreground">
          Checking…
        </Text>
      ) : null}
      {!error && status === 'available' ? (
        <Text className="mt-1 font-sans text-xs text-primary">Available</Text>
      ) : null}
      {!error && status === 'taken' ? (
        <Text className="mt-1 font-sans text-xs text-destructive">
          Already taken
        </Text>
      ) : null}
    </VStack>
  );
}
