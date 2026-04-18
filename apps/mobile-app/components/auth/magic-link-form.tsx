import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Spinner } from '@/components/ui/spinner';
import { Pressable } from '@/components/ui/pressable';
import { useLocalization } from '@/context';

import type { MagicStep } from '@/hooks/useLoginAuth';

interface MagicLinkFormProps {
  email: string;
  step: MagicStep;
  error: string;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
}

export function MagicLinkForm({
  email,
  step,
  error,
  loading,
  onEmailChange,
  onSubmit,
  onReset,
}: MagicLinkFormProps) {
  const { t } = useLocalization();

  if (step === 'sent') {
    return (
      <VStack className="items-center gap-3">
        <Text className="font-sans text-xl font-semibold text-foreground">
          {t('auth.login.magic_link_sent_title')}
        </Text>
        <Text className="text-center font-sans text-sm text-muted-foreground">
          {t('auth.login.magic_link_sent_message', { email })}
        </Text>
        <Pressable className="mt-4" onPress={onReset}>
          <Text className="font-sans text-sm text-primary underline">
            {t('auth.login.magic_link_use_different_email')}
          </Text>
        </Pressable>
      </VStack>
    );
  }

  return (
    <VStack className="gap-2">
      <Text className="font-sans text-sm font-medium text-foreground">
        {t('auth.login.magic_link_email_label')}
      </Text>
      <Input>
        <InputField
          placeholder={t('auth.login.magic_link_email_placeholder')}
          value={email}
          onChangeText={onEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      </Input>
      {error ? (
        <Text className="font-sans text-sm text-destructive">{error}</Text>
      ) : null}
      <Button
        onPress={onSubmit}
        disabled={loading || !email.trim()}
        className="mt-2"
      >
        {loading ? (
          <Spinner size="small" className="text-primary-foreground" />
        ) : (
          <ButtonText>{t('auth.login.magic_link_submit')}</ButtonText>
        )}
      </Button>
    </VStack>
  );
}
