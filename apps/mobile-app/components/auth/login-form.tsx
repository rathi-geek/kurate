import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { View } from '@/components/ui/view';
import { useLocalization } from '@/context';
import GoogleIcon from '@kurate/icons/platform/google.svg';
import AppleIcon from '@kurate/icons/platform/apple.svg';
import { BrandLogo } from '@/components/brand/brand-logo';

import { useLoginAuth } from '@/hooks/useLoginAuth';
import { MagicLinkForm } from './magic-link-form';

export function LoginForm() {
  const { t } = useLocalization();
  const {
    googleLoading,
    handleGoogle,
    appleLoading,
    appleAvailable,
    handleApple,
    magicEmail,
    setMagicEmail,
    magicStep,
    magicError,
    magicLoading,
    handleMagicLink,
    resetMagicLink,
  } = useLoginAuth();

  return (
    <VStack className="gap-4">
      <VStack className="mb-4 gap-2">
        <BrandLogo />
      </VStack>

      <VStack className="mb-4 gap-2">
        <Text className="font-sans text-3xl font-bold text-foreground">
          {t('auth.login.title')}
        </Text>
      </VStack>

      <HStack className="gap-3">
        <Button
          variant="outline"
          onPress={handleGoogle}
          disabled={googleLoading}
          className="flex-1 p-1"
        >
          {googleLoading ? (
            <Spinner size="small" className="text-foreground" />
          ) : (
            <HStack className="items-center gap-2 ">
              <GoogleIcon width={24} height={24} />
              <ButtonText className="text-md text-foreground">
                {t('auth.login.google')}
              </ButtonText>
            </HStack>
          )}
        </Button>
        {appleAvailable ? (
          <Button
            variant="outline"
            onPress={handleApple}
            disabled={appleLoading}
            className="flex-1"
          >
            {appleLoading ? (
              <Spinner size="small" className="text-foreground" />
            ) : (
              <HStack className="items-center gap-2 ">
                <AppleIcon width={24} height={24} />
                <ButtonText className="text-md text-foreground">
                  {t('auth.login.apple')}
                </ButtonText>
              </HStack>
            )}
          </Button>
        ) : null}
      </HStack>

      <HStack className=" items-center gap-2">
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
