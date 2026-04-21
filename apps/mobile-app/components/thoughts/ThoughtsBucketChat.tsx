import { useCallback, useEffect } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { ChevronLeft } from 'lucide-react-native';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { ThoughtBubble, type DisplayMessage } from './ThoughtBubble';
import { ThoughtsEmptyState } from './ThoughtsEmptyState';

interface ThoughtsBucketChatProps {
  bucket: string;
  bucketLabel: string;
  color: string;
  messages: DisplayMessage[];
  searchQuery: string;
  onBack: () => void;
  onLongPress: (id: string, text: string) => void;
}

export function ThoughtsBucketChat({
  bucket,
  bucketLabel,
  color,
  messages,
  searchQuery,
  onBack,
  onLongPress,
}: ThoughtsBucketChatProps) {
  const translateX = useSharedValue(400);

  useEffect(() => {
    translateX.value = withTiming(0, { duration: 250 });
  }, [translateX]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const bucketMessages = messages.filter(m => m.bucket === bucket);
  const renderItem = useCallback(
    ({ item }: { item: DisplayMessage }) => (
      <ThoughtBubble
        message={item}
        bucketColor={color}
        onLongPress={(id, text) => onLongPress(id, text)}
      />
    ),
    [color, onLongPress],
  );

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
        },
        animStyle,
      ]}
      className="bg-background"
    >
      <HStack className="items-center gap-2 px-4 pb-2 pt-4">
        <Pressable
          onPress={onBack}
          className="rounded-full bg-background/80 p-1"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </Pressable>
        <Text className="font-sans text-base font-semibold text-foreground">
          {bucketLabel}
        </Text>
      </HStack>
      {bucketMessages.length === 0 ? (
        <ThoughtsEmptyState isSearching={searchQuery.length > 0} />
      ) : (
        <FlashList
          data={bucketMessages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 16,
            paddingTop: 8,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Animated.View>
  );
}
