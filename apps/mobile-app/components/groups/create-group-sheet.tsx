import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
  BottomSheet,
  BottomSheetView,
  type BottomSheetHandle,
} from '@/components/ui/bottom-sheet';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import { Textarea, TextareaField } from '@/components/ui/textarea';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { useLocalization } from '@/context';
import { supabase } from '@/libs/supabase/client';
import { queryKeys } from '@kurate/query';

interface CreateGroupSheetProps {
  open: boolean;
  onClose: () => void;
}

const schema = z.object({
  name: z.string().min(1).max(50, 'Group name must be 50 characters or less'),
  description: z.string(),
});
type FormValues = z.infer<typeof schema>;

export function CreateGroupSheet({ open, onClose }: CreateGroupSheetProps) {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const router = useRouter();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const snapPoints = useMemo(() => ['55%'], []);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (open) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [open]);

  const onSubmit = useCallback(
    async ({ name, description }: FormValues) => {
      const trimmedName = name.trim();
      if (!trimmedName) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Toast.show({ type: 'error', text1: t('groups.error_generic') });
        return;
      }

      const { data: group, error: groupError } = await supabase
        .from('conversations')
        .insert({
          group_name: trimmedName,
          group_description: description?.trim() || null,
          group_max_members: 50,
          is_group: true,
        })
        .select('id')
        .single();

      if (groupError || !group) {
        const errMsg = groupError?.message ?? '';
        const msg =
          errMsg.toLowerCase().includes('unique') ||
          errMsg.toLowerCase().includes('duplicate')
            ? t('groups.name_taken')
            : errMsg.includes('character varying')
              ? t('validation.group_name_too_long', { max: 50 })
              : t('groups.error_generic');
        Toast.show({ type: 'error', text1: msg });
        return;
      }

      const { error: memberError } = await supabase
        .from('conversation_members')
        .upsert(
          { convo_id: group.id, user_id: user.id, role: 'owner' },
          { onConflict: 'convo_id,user_id', ignoreDuplicates: true },
        );

      if (memberError) {
        Toast.show({ type: 'error', text1: t('groups.error_generic') });
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });
      reset();
      onClose();
      router.push(`/groups/${group.id}` as never);
    },
    [t, queryClient, reset, onClose, router],
  );

  const handleDismiss = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onDismiss={handleDismiss}
    >
      <BottomSheetView>
        <VStack className="gap-4 px-4 pb-8 pt-2">
          <Text className="font-sans text-lg font-semibold text-foreground">
            {t('groups.create_title')}
          </Text>

          <VStack className="gap-1.5">
            <Text className="font-sans text-sm font-medium text-foreground">
              {t('groups.create_name_label')}
            </Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input>
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={t('groups.create_name_placeholder')}
                    maxLength={50}
                    autoFocus
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </Input>
              )}
            />
          </VStack>

          <VStack className="gap-1.5">
            <Text className="font-sans text-sm font-medium text-foreground">
              {t('groups.group_description')}{' '}
              <Text className="font-sans text-sm font-normal text-muted-foreground">
                {t('groups.create_desc_optional')}
              </Text>
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <Textarea>
                  <TextareaField
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={t('groups.create_desc_placeholder')}
                    numberOfLines={3}
                  />
                </Textarea>
              )}
            />
          </VStack>

          <HStack className="justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onPress={handleDismiss}
              disabled={isSubmitting}
            >
              <ButtonText>{t('groups.cancel')}</ButtonText>
            </Button>
            <Button
              size="sm"
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? (
                <ButtonSpinner />
              ) : (
                <ButtonText>{t('groups.create_submit')}</ButtonText>
              )}
            </Button>
          </HStack>
        </VStack>
      </BottomSheetView>
    </BottomSheet>
  );
}
