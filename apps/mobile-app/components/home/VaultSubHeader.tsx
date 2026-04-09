import { useState } from 'react';
import { TextInput } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { ArrowLeft, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useLocalization } from '@/context';
import { VaultTab } from '@kurate/types';
import { lightTheme } from '@kurate/theme';

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

  const handleClose = () => {
    setLocalSearch('');
    onSearchQueryChange('');
    onSearchToggle();
  };

  return (
    <View className="border-b border-border px-5">
      {/* Tabs row — hidden when search open */}
      <View
        className="flex-row items-center"
        style={{ display: searchOpen ? 'none' : 'flex' }}
      >
        <View className="flex-row items-center gap-0">
          {TABS.map(tab => {
            const isActive = vaultTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => onTabChange(tab)}
                className="relative mr-5 py-1.5"
              >
                <Text
                  className={`text-sm font-semibold capitalize ${isActive ? 'text-foreground' : 'text-foreground/40'}`}
                >
                  {tab}
                </Text>
                {isActive && (
                  <View className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-foreground" />
                )}
              </Pressable>
            );
          })}
        </View>
        <View className="ml-auto flex-row items-center gap-3">
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
        </View>
      </View>

      {/* Search row — hidden when search closed */}
      <View
        className="my-1.5 flex-row items-center gap-2 rounded-full bg-card px-3 py-1 shadow-sm"
        style={{ display: searchOpen ? 'flex' : 'none' }}
      >
        <Pressable onPress={handleClose} className="p-1">
          <ArrowLeft size={16} className="text-muted-foreground" />
        </Pressable>
        <TextInput
          className="flex-1 font-sans text-sm text-foreground"
          placeholder={t('vault.search_placeholder')}
          placeholderTextColor={lightTheme.brandMutedForeground}
          value={localSearch}
          onChangeText={text => {
            setLocalSearch(text);
            onSearchQueryChange(text);
          }}
          autoFocus={searchOpen}
          returnKeyType="search"
        />
        {localSearch.length > 0 && (
          <Pressable
            onPress={() => {
              setLocalSearch('');
              onSearchQueryChange('');
            }}
            className="p-1"
          >
            <X size={14} className="text-muted-foreground" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
