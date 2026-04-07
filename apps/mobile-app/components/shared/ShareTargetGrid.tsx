import { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, TextInput } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Search, Check } from 'lucide-react-native';
import { useLocalization } from '@/context';
import { useShareableConversations } from '@/hooks/useShareableConversations';
import type { ShareableConversation } from '@/hooks/useShareableConversations';
import { lightTheme } from '@kurate/theme';

interface ShareTargetGridProps {
  selectedIds: Set<string>;
  onSelectionChange: (ids: string[]) => void;
  alreadySharedIds: Set<string>;
  enabled?: boolean;
}

function AvatarItem({
  item,
  isSelected,
  isShared,
  onPress,
}: {
  item: ShareableConversation;
  isSelected: boolean;
  isShared: boolean;
  onPress: () => void;
}) {
  const initial = item.name.charAt(0).toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      disabled={isShared}
      className="w-[25%] items-center py-2"
      style={{ opacity: isShared ? 0.6 : 1 }}
    >
      <View className="relative">
        {item.avatar_url ? (
          <Image
            source={{ uri: item.avatar_url }}
            className="h-12 w-12 rounded-full"
          />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Text className="text-sm font-semibold text-foreground">
              {initial}
            </Text>
          </View>
        )}
        {(isSelected || isShared) && (
          <View
            className="absolute -bottom-0.5 -right-0.5 h-5 w-5 items-center justify-center rounded-full"
            style={{
              backgroundColor: isShared ? '#9ca3af' : lightTheme.brandPrimary,
            }}
          >
            <Check size={12} color={lightTheme.brandWhite} />
          </View>
        )}
      </View>
      <Text
        className="mt-1 max-w-[80px] text-center text-xs text-foreground"
        numberOfLines={1}
      >
        {item.name}
      </Text>
    </Pressable>
  );
}

export function ShareTargetGrid({
  selectedIds,
  onSelectionChange,
  alreadySharedIds,
  enabled = true,
}: ShareTargetGridProps) {
  const { t } = useLocalization();
  const { data: conversations, isLoading } = useShareableConversations(enabled);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!conversations) return [];
    if (!search) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(c => c.name.toLowerCase().includes(q));
  }, [conversations, search]);

  const handleToggle = useCallback(
    (id: string) => {
      if (alreadySharedIds.has(id)) return;
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelectionChange(Array.from(next));
    },
    [selectedIds, alreadySharedIds, onSelectionChange],
  );

  if (isLoading) {
    return (
      <View className="flex-row flex-wrap gap-3 px-4 py-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} className="items-center gap-1">
            <View className="h-12 w-12 rounded-full bg-muted opacity-60" />
            <View className="h-2 w-10 rounded bg-muted opacity-60" />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View>
      <View className="mx-4 mb-2 flex-row items-center gap-2 rounded-lg border border-border px-3 py-1.5">
        <Search size={14} className="text-muted-foreground" />
        <TextInput
          className="flex-1 text-sm text-foreground"
          placeholder={t('vault.share_modal_search_placeholder')}
          placeholderTextColor={lightTheme.brandMutedForeground}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {filtered.length === 0 ? (
        <Text className="px-4 py-6 text-center text-sm text-muted-foreground">
          {search
            ? t('vault.share_modal_no_results')
            : t('vault.share_modal_no_targets')}
        </Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          numColumns={4}
          renderItem={({ item }) => (
            <AvatarItem
              item={item}
              isSelected={selectedIds.has(item.id)}
              isShared={alreadySharedIds.has(item.id)}
              onPress={() => handleToggle(item.id)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 8 }}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}
