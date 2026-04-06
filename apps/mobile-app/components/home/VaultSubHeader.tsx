import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { VaultTab } from '@kurate/types';

interface VaultSubHeaderProps {
  vaultTab: VaultTab;
  onTabChange: (tab: VaultTab) => void;
  onSearchToggle: () => void;
  onFilterPress: () => void;
  hasActiveFilter: boolean;
}

const TABS = [VaultTab.LINKS, VaultTab.THOUGHTS] as const;

export function VaultSubHeader({
  vaultTab,
  onTabChange,
  onSearchToggle,
  onFilterPress,
  hasActiveFilter,
}: VaultSubHeaderProps) {
  return (
    <HStack className="items-center border-b border-border px-5 pb-2">
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
    </HStack>
  );
}
