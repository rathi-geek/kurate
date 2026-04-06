import { Modal } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Button, ButtonText } from '@/components/ui/button';
import { useLocalization } from '@/context';
import {
  TIME_FILTER_OPTIONS,
  CONTENT_TYPE_FILTER_OPTIONS,
  READ_STATUS_FILTER_OPTIONS,
} from '@kurate/types';
import type { VaultFilters } from '@kurate/types';

interface VaultFilterSheetProps {
  open: boolean;
  filters: VaultFilters;
  onChange: (f: VaultFilters) => void;
  onClose: () => void;
}

const DEFAULT_FILTERS: VaultFilters = {
  time: 'all',
  contentType: 'all',
  search: '',
  readStatus: 'all',
};

export function hasActiveFilters(filters: VaultFilters): boolean {
  return (
    filters.time !== 'all' ||
    filters.contentType !== 'all' ||
    filters.readStatus !== 'all'
  );
}

function FilterSection({
  label,
  options,
  activeValue,
  onSelect,
  t,
}: {
  label: string;
  options: ReadonlyArray<{ value: string; labelKey: string }>;
  activeValue: string;
  onSelect: (value: string) => void;
  t: (key: string) => string;
}) {
  return (
    <View className="gap-2">
      <Text className="font-sans text-xs font-bold text-foreground">
        {label}
      </Text>
      <HStack className="flex-wrap gap-2">
        {options.map(option => {
          const isActive = activeValue === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              className={`rounded-[6px] px-3 py-1.5 ${isActive ? 'bg-primary' : 'bg-muted'}`}
            >
              <Text
                className={`text-xs font-medium ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}
              >
                {t(`vault.${option.labelKey}`)}
              </Text>
            </Pressable>
          );
        })}
      </HStack>
    </View>
  );
}

export function VaultFilterSheet({
  open,
  filters,
  onChange,
  onClose,
}: VaultFilterSheetProps) {
  const { t } = useLocalization();
  const showClear = hasActiveFilters(filters);

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/20" onPress={onClose} />
      <View className="rounded-t-2xl border-t border-border bg-background shadow-lg">
        <View className="mx-auto mt-3 h-1 w-8 rounded-full bg-muted-foreground/30" />
        <HStack className="items-center justify-between px-4 pb-2 pt-4">
          <Text className="font-sans text-base font-bold text-foreground">
            {t('vault.filters')}
          </Text>
          {showClear && (
            <Pressable
              onPress={() =>
                onChange({ ...DEFAULT_FILTERS, search: filters.search })
              }
            >
              <Text className="text-sm text-primary">
                {t('vault.clear_filters')}
              </Text>
            </Pressable>
          )}
        </HStack>
        <View className="gap-5 px-4 pb-2 pt-2">
          <FilterSection
            label={t('vault.filter_section_time')}
            options={TIME_FILTER_OPTIONS}
            activeValue={filters.time}
            onSelect={v =>
              onChange({ ...filters, time: v as VaultFilters['time'] })
            }
            t={t}
          />
          <FilterSection
            label={t('vault.filter_section_type')}
            options={CONTENT_TYPE_FILTER_OPTIONS}
            activeValue={filters.contentType}
            onSelect={v =>
              onChange({
                ...filters,
                contentType: v as VaultFilters['contentType'],
              })
            }
            t={t}
          />
          <FilterSection
            label={t('vault.filter_section_read_status')}
            options={READ_STATUS_FILTER_OPTIONS}
            activeValue={filters.readStatus}
            onSelect={v =>
              onChange({
                ...filters,
                readStatus: v as VaultFilters['readStatus'],
              })
            }
            t={t}
          />
        </View>
        <View className="mx-4 mb-6 mt-4">
          <Button onPress={onClose}>
            <ButtonText>{t('vault.filter_done')}</ButtonText>
          </Button>
        </View>
      </View>
    </Modal>
  );
}
