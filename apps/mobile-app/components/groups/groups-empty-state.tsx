import React from 'react';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useLocalization } from '@/context';

interface GroupsEmptyStateProps {
  onCreate: () => void;
}

export function GroupsEmptyState({ onCreate }: GroupsEmptyStateProps) {
  const { t } = useLocalization();
  return (
    <VStack className="flex-1 items-center justify-center gap-4 p-8">
      <Text className="text-center font-sans text-base text-muted-foreground">
        {t('groups.my_groups_empty')}
      </Text>
      <Button onPress={onCreate} size="default">
        <ButtonText>{t('groups.create_submit')}</ButtonText>
      </Button>
    </VStack>
  );
}
