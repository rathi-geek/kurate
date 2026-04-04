import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { View } from '@/components/ui/view';
import { useLocalization } from '@/context';
import GoogleIcon from '@kurate/icons/platform/google.svg';
import { BrandLogo } from '@/components/brand/brand-logo';

import { useLoginAuth } from '@/hooks/useLoginAuth';
import { MagicLinkForm } from './magic-link-form';

export function LoginForm() {
  const { t } = useLocalization();
  const {
    googleLoading,
    handleGoogle,
    magicEmail,
    setMagicEmail,
    magicStep,
    magicError,
    magicLoading,
    handleMagicLink,
    resetMagicLink,
  } = useLoginAuth();

  return (
    <VStack className="gap-6">
      <VStack className="mb-4 gap-2">
        <BrandLogo />
      </VStack>

      <VStack className="mb-4 gap-2">
        <Text className="font-sans text-3xl font-bold text-foreground">
          {t('auth.login.title')}
        </Text>
      </VStack>

      <Button variant="outline" onPress={handleGoogle} disabled={googleLoading}>
        {googleLoading ? (
          <Spinner size="small" className="text-foreground" />
        ) : (
          <HStack className="items-center gap-2">
            <GoogleIcon width={18} height={18} />
            <ButtonText className="text-foreground">
              {t('auth.login.google')}
            </ButtonText>
          </HStack>
        )}
      </Button>

      <HStack className="my-2 items-center gap-3">
        <View className="h-px flex-1 bg-border" />
        <Text className="font-sans text-xs text-muted-foreground">
          {t('auth.login.or_divider')}
        </Text>
        <View className="h-px flex-1 bg-border" />
      </HStack>

      <MagicLinkForm
        email={magicEmail}
        step={magicStep}
        error={magicError}
        loading={magicLoading}
        onEmailChange={setMagicEmail}
        onSubmit={handleMagicLink}
        onReset={resetMagicLink}
      />
    </VStack>
  );
}
