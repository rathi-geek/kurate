import React, { useCallback, useState } from 'react';
import { Send } from 'lucide-react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { useLocalization } from '@/context';
import { lightTheme } from '@kurate/theme';

interface ReplyInputProps {
  onSubmit: (text: string) => void;
  isSubmitting: boolean;
  placeholder?: string;
}

export function ReplyInput({
  onSubmit,
  isSubmitting,
  placeholder,
}: ReplyInputProps) {
  const { t } = useLocalization();
  const [value, setValue] = useState('');

  const canSend = !isSubmitting && value.trim().length > 0;

  const handleSubmit = useCallback(() => {
    if (!canSend) return;
    onSubmit(value.trim());
    setValue('');
  }, [canSend, value, onSubmit]);

  return (
    <HStack className="mx-4 mb-2 mt-1 h-12 items-center rounded-full bg-card p-2 shadow-sm">
      <BottomSheetTextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder ?? t('groups.comment_placeholder')}
        placeholderTextColor={lightTheme.brandMutedForeground}
        editable={!isSubmitting}
        onSubmitEditing={handleSubmit}
        returnKeyType="send"
        multiline={false}
        style={{
          flex: 1,
          paddingHorizontal: 8,
          paddingVertical: 6,
          fontFamily: 'DMSans_400Regular',
          fontSize: 14,
          color: lightTheme.brandForeground,
        }}
      />
      {canSend || isSubmitting ? (
        <Pressable
          onPress={handleSubmit}
          disabled={!canSend}
          className="h-8 w-8 items-center justify-center rounded-full bg-primary"
        >
          {isSubmitting ? (
            <Spinner className="text-primary-foreground" />
          ) : (
            <Icon as={Send} size="2xs" className="text-primary-foreground" />
          )}
        </Pressable>
      ) : null}
    </HStack>
  );
}
