import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { useLocalization } from '@/context';

interface ThoughtsEmptyStateProps {
  isSearching: boolean;
}

export function ThoughtsEmptyState({ isSearching }: ThoughtsEmptyStateProps) {
  const { t } = useLocalization();

  return (
    <VStack className="flex-1 items-center justify-center gap-3 p-8">
      <Text className="text-center font-sans text-lg font-bold text-foreground">
        {isSearching
          ? t('thoughts.empty_no_match')
          : t('thoughts.empty_no_thoughts')}
      </Text>
      <Text className="text-center font-sans text-sm text-muted-foreground">
        {isSearching
          ? t('thoughts.empty_try_keywords')
          : t('thoughts.empty_start_typing')}
      </Text>
    </VStack>
  );
}
