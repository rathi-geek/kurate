import { useState } from 'react';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { BrandLogo } from '@/components/brand/brand-logo';
import { EllipsisVertical } from 'lucide-react-native';
import { useLocalization } from '@/context';
import { HomeTab } from '@kurate/types';

interface HomeHeaderProps {
  activeTab: HomeTab;
  onTabChange: (tab: HomeTab) => void;
}

const TAB_OPTIONS = [
  { tab: HomeTab.VAULT, labelKey: 'chat.tab_vault' },
  { tab: HomeTab.DISCOVERING, labelKey: 'chat.tab_discovering' },
] as const;

export function HomeHeader({ activeTab, onTabChange }: HomeHeaderProps) {
  const { t } = useLocalization();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeLabel =
    activeTab === HomeTab.VAULT
      ? t('chat.tab_vault')
      : t('chat.tab_discovering');

  return (
    <HStack className="items-center justify-between bg-background px-4 py-3">
      <BrandLogo size={20} name={activeLabel} />
      <View>
        <Pressable onPress={() => setMenuOpen(prev => !prev)} className="p-1">
          <EllipsisVertical size={20} className="text-muted-foreground" />
        </Pressable>
        {menuOpen && (
          <View className="absolute right-0 top-8 z-50 rounded-xl border border-border bg-card p-2 shadow-lg">
            {TAB_OPTIONS.map(({ tab, labelKey }) => (
              <Pressable
                key={tab}
                onPress={() => {
                  onTabChange(tab);
                  setMenuOpen(false);
                }}
                className="px-4 py-2"
              >
                <Text
                  className={`text-sm ${activeTab === tab ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
                >
                  {t(labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </HStack>
  );
}
