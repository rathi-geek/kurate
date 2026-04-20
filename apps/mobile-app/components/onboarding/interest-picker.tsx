import { useState } from 'react';
import { INTEREST_OPTIONS } from '@kurate/utils';

import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { useLocalization } from '@/context';

const VISIBLE_COUNT = 5;

interface InterestPickerProps {
  interests: string[];
  onToggle: (interest: string) => void;
}

export function InterestPicker({ interests, onToggle }: InterestPickerProps) {
  const { t } = useLocalization();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded
    ? INTEREST_OPTIONS
    : INTEREST_OPTIONS.slice(0, VISIBLE_COUNT);

  return (
    <VStack className="gap-3">
      <Text className="font-sans text-sm font-medium text-foreground">
        {t('auth.onboarding.interests_label')}
      </Text>
      <HStack className="flex-wrap gap-2">
        {visible.map(interest => {
          const selected = interests.includes(interest);
          return (
            <Pressable
              key={interest}
              onPress={() => onToggle(interest)}
              className={`rounded-[6px] px-3 py-1.5 ${
                selected ? 'bg-primary' : 'border-border bg-card'
              }`}
              style={{
                borderWidth: 1,
                borderColor: selected ? 'transparent' : undefined,
              }}
            >
              <Text className={`font-sans text-sm `}>{interest}</Text>
            </Pressable>
          );
        })}
        <Pressable onPress={() => setExpanded(v => !v)} className="px-3 py-1.5">
          <Text className="font-sans text-sm text-muted-foreground underline">
            {expanded
              ? t('auth.onboarding.show_less')
              : t('auth.onboarding.show_more')}
          </Text>
        </Pressable>
      </HStack>
    </VStack>
  );
}
