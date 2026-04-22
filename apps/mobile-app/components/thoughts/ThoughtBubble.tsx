import React from 'react';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import type { ThoughtMessage } from '@kurate/types';

export type DisplayMessage = ThoughtMessage & {
  _pending?: boolean;
  _failed?: boolean;
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface ThoughtBubbleProps {
  message: DisplayMessage;
  bucketColor: string;
  bucketLabel?: string;
  showBucketLabel?: boolean;
  onLongPress?: (id: string, text: string) => void;
}

export const ThoughtBubble = React.memo(function ThoughtBubble({
  message,
  bucketColor,
  bucketLabel,
  showBucketLabel,
  onLongPress,
}: ThoughtBubbleProps) {
  return (
    <View className="ml-auto max-w-[75%]">
      <Pressable
        onLongPress={() => onLongPress?.(message.id, message.text)}
        className="rounded-2xl rounded-br-sm px-3 py-2"
        style={{
          backgroundColor: bucketColor,
          opacity: message._pending ? 0.7 : 1,
        }}
      >
        <Text className="text-sm leading-snug text-foreground">
          {message.text}
        </Text>
        <View className="mt-0.5 flex-row items-center justify-between gap-3">
          {showBucketLabel && bucketLabel && (
            <Text className="text-[9px] text-foreground/40">{bucketLabel}</Text>
          )}
          <View className="flex-row items-center gap-1">
            <Text className="text-[9px] text-foreground/40">
              {formatTime(message.created_at)}
            </Text>
            {message._pending && (
              <Text className="text-[9px] text-foreground/40">⏱</Text>
            )}
            {message._failed && (
              <Text className="text-[9px] text-red-400">!</Text>
            )}
          </View>
        </View>
      </Pressable>
    </View>
  );
});
