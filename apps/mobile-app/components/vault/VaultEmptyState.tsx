import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Archive } from 'lucide-react-native';
import { useLocalization } from '@/context';
import type { VaultFilters } from '@kurate/types';

interface VaultEmptyStateProps {
  variant?: 'default' | 'filtered';
  filters?: VaultFilters;
}

function useFilteredMessage(
  t: (key: string, opts?: Record<string, string>) => string,
  filters?: VaultFilters,
): string {
  if (!filters) return t('vault.empty_state_title');

  const itemLabel = t(
    `vault.empty_state_filtered_items_${filters.contentType === 'all' ? 'all' : filters.contentType}`,
  );
  const timeLabel =
    filters.time !== 'all'
      ? t(`vault.empty_state_filtered_time_${filters.time}`)
      : '';
  const readLabel =
    filters.readStatus !== 'all'
      ? t(`vault.empty_state_filtered_read_${filters.readStatus}`)
      : '';

  if (readLabel && timeLabel) {
    return t('vault.empty_state_filtered_message_read_with_time', {
      readStatusLabel: readLabel,
      itemLabel,
      timeLabel,
    });
  }
  if (readLabel) {
    return t('vault.empty_state_filtered_message_read', {
      readStatusLabel: readLabel,
      itemLabel,
    });
  }
  if (timeLabel) {
    return t('vault.empty_state_filtered_message_with_time', {
      itemLabel,
      timeLabel,
    });
  }
  return t('vault.empty_state_filtered_message', { itemLabel });
}

export function VaultEmptyState({
  variant = 'default',
  filters,
}: VaultEmptyStateProps) {
  const { t } = useLocalization();
  const isFiltered = variant === 'filtered';
  const title = isFiltered
    ? useFilteredMessage(t, filters)
    : t('vault.empty_state_title');
  const subtitle = isFiltered
    ? t('vault.empty_state_filtered_subtitle')
    : t('vault.empty_state_subtitle');

  return (
    <VStack className="flex-1 items-center justify-center gap-4 p-8">
      <Archive size={48} className="text-muted-foreground opacity-30" />
      <Text className="text-center font-sans text-lg font-bold text-foreground">
        {title}
      </Text>
      <Text className="text-center font-sans text-sm text-muted-foreground">
        {subtitle}
      </Text>
    </VStack>
  );
}
