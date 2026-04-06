import { useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { ArrowLeft, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useLocalization } from '@/context';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { VaultTab } from '@kurate/types';

interface VaultSubHeaderProps {
  vaultTab: VaultTab;
  onTabChange: (tab: VaultTab) => void;
  searchOpen: boolean;
  onSearchToggle: () => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onFilterPress: () => void;
  hasActiveFilter: boolean;
}

const TABS = [VaultTab.LINKS, VaultTab.THOUGHTS] as const;

export function VaultSubHeader({
  vaultTab,
  onTabChange,
  searchOpen,
  onSearchToggle,
  searchQuery,
  onSearchQueryChange,
  onFilterPress,
  hasActiveFilter,
}: VaultSubHeaderProps) {
  const { t } = useLocalization();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebouncedValue(localSearch);

  useEffect(() => {
    onSearchQueryChange(debouncedSearch);
  }, [debouncedSearch, onSearchQueryChange]);

  const handleCloseSearch = () => {
    setLocalSearch('');
    onSearchQueryChange('');
    onSearchToggle();
  };

  return (
    <HStack className="items-center border-b border-border px-5 pb-2">
      {searchOpen ? (
        <HStack className="flex-1 items-center gap-2 rounded-full bg-card px-3 py-1 shadow-sm">
          <Pressable onPress={handleCloseSearch} className="p-1">
            <ArrowLeft size={16} className="text-muted-foreground" />
          </Pressable>
          <TextInput
            className="flex-1 font-sans text-sm text-foreground"
            placeholder={t('vault.search_placeholder')}
            placeholderTextColor="#5b7d99"
            value={localSearch}
            onChangeText={setLocalSearch}
            autoFocus
            returnKeyType="search"
          />
          {localSearch.length > 0 && (
            <Pressable onPress={() => setLocalSearch('')} className="p-1">
              <X size={14} className="text-muted-foreground" />
            </Pressable>
          )}
        </HStack>
      ) : (
        <>
          <HStack className="items-center gap-4">
            {TABS.map(tab => {
              const isActive = vaultTab === tab;
              return (
                <Pressable key={tab} onPress={() => onTabChange(tab)}>
                  <View
                    className={`pb-1 ${isActive ? 'border-b-2 border-foreground' : ''}`}
                  >
                    <Text
                      className={`text-sm capitalize ${isActive ? 'font-semibold text-foreground' : 'text-foreground/40'}`}
                    >
                      {tab}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </HStack>
          <HStack className="ml-auto items-center gap-3">
            <Pressable onPress={onSearchToggle} className="p-1">
              <Search size={16} className="text-muted-foreground" />
            </Pressable>
            {vaultTab === VaultTab.LINKS && (
              <Pressable onPress={onFilterPress} className="p-1">
                <SlidersHorizontal
                  size={16}
                  className={
                    hasActiveFilter ? 'text-primary' : 'text-muted-foreground'
                  }
                />
              </Pressable>
            )}
          </HStack>
        </>
      )}
    </HStack>
  );
}
