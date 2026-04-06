import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react-native';
import { useLocalization } from '@/context';

interface VaultErrorStateProps {
  onRetry: () => void;
}

export function VaultErrorState({ onRetry }: VaultErrorStateProps) {
  const { t } = useLocalization();

  return (
    <VStack className="flex-1 items-center justify-center gap-3 p-8">
      <AlertCircle size={24} className="text-destructive opacity-60" />
      <Text className="font-sans text-base font-bold text-foreground">
        {t('vault.error_state_title')}
      </Text>
      <Text className="text-center font-sans text-sm text-muted-foreground">
        {t('vault.error_state_subtitle')}
      </Text>
      <Button variant="outline" size="sm" onPress={onRetry}>
        <ButtonText>{t('vault.error_state_retry_btn')}</ButtonText>
      </Button>
    </VStack>
  );
}
