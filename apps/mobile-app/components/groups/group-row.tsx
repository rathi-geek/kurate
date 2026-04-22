import React from 'react';
import { View } from '@/components/ui/view';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { Avatar } from '@/components/ui/avatar';
import type { GroupRow as GroupRowType } from '@kurate/hooks';

interface GroupRowProps {
  group: GroupRowType;
  onPress: (id: string) => void;
  unreadCount?: number;
}

export const GroupRow = React.memo(function GroupRow({
  group,
  onPress,
  unreadCount = 0,
}: GroupRowProps) {
  return (
    <Pressable
      onPress={() => onPress(group.id)}
      className="flex-row items-center gap-3 px-3 py-1 active:bg-accent/40"
    >
      <Avatar uri={group.avatarUrl} name={group.name} size={42} />
      <Text
        numberOfLines={1}
        className="min-w-0 flex-1 font-sans text-base font-medium text-foreground"
      >
        {group.name}
      </Text>
      {unreadCount > 0 ? (
        <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5">
          <Text
            className="font-sans text-[10px] font-bold text-primary-foreground"
            style={{ lineHeight: 12 }}
          >
            {unreadCount > 99 ? '99+' : String(unreadCount)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
});
