import { View } from '@/components/ui/view';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';

interface SectionDividerProps {
  label: string;
}

export function SectionDivider({ label }: SectionDividerProps) {
  return (
    <HStack className="items-center gap-3 px-4 py-2">
      <View className="h-px flex-1 bg-border" />
      <Text className="font-sans text-xs font-medium text-muted-foreground">
        {label}
      </Text>
      <View className="h-px flex-1 bg-border" />
    </HStack>
  );
}
