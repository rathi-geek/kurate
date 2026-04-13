import React from 'react';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable } from '@/components/ui/pressable';
import { View } from '@/components/ui/view';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';

interface GroupHeaderProps {
  name: string;
  avatarUrl?: string | null;
  onBack: () => void;
}

export function GroupHeader({ name, avatarUrl, onBack }: GroupHeaderProps) {
  return (
    <View className="border-b border-border bg-background px-2 py-2">
      <HStack className="items-center gap-2">
        <Pressable
          onPress={onBack}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-accent"
          accessibilityLabel="Back"
        >
          <Icon as={ChevronLeft} size="lg" className="text-foreground" />
        </Pressable>
        <Avatar uri={avatarUrl} name={name} size={32} />
        <Text
          numberOfLines={1}
          className="min-w-0 flex-1 font-sans text-base font-semibold text-foreground"
        >
          {name}
        </Text>
      </HStack>
    </View>
  );
}
