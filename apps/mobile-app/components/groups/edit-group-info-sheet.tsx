import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Camera } from 'lucide-react-native';
import {
  BottomSheet,
  BottomSheetView,
  type BottomSheetHandle,
} from '@/components/ui/bottom-sheet';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Textarea, TextareaField } from '@/components/ui/textarea';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { useLocalization } from '@/context';
import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';
import { AVATARS_BUCKET } from '@kurate/hooks';
import { queryKeys } from '@kurate/query';

interface EditGroupInfoSheetProps {
  open: boolean;
  groupId: string;
  initialName: string;
  initialDescription: string;
  initialAvatarUrl: string | null;
  onClose: () => void;
  onAvatarUploaded?: (url: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function EditGroupInfoSheet({
  open,
  groupId,
  initialName,
  initialDescription,
  initialAvatarUrl,
  onClose,
  onAvatarUploaded,
}: EditGroupInfoSheetProps) {
  const { t } = useLocalization();
  const userId = useAuthStore(state => state.userId) ?? '';
  const queryClient = useQueryClient();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const snapPoints = useMemo(() => ['75%'], []);

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Reset form whenever the sheet opens with potentially different initial values.
  useEffect(() => {
    if (open) {
      setName(initialName);
      setDescription(initialDescription);
      setAvatarUrl(initialAvatarUrl);
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [open, initialName, initialDescription, initialAvatarUrl]);

  const handlePickAvatar = useCallback(async () => {
    if (uploading || !userId) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const fileSize = asset.fileSize ?? 0;
    if (fileSize > MAX_FILE_SIZE) {
      Toast.show({ type: 'error', text1: 'Image must be under 5 MB' });
      return;
    }

    const localUri = asset.uri;
    setAvatarUrl(localUri); // optimistic preview
    setUploading(true);

    try {
      const fileName = asset.fileName ?? `group.${localUri.split('.').pop()}`;
      const fileType = asset.mimeType ?? 'image/jpeg';
      const ext = fileName.split('.').pop() ?? 'jpg';
      const path = `group_avatars/${groupId}.${ext}`;

      const formData = new FormData();
      formData.append('file', {
        uri: localUri,
        type: fileType,
        name: fileName,
      } as unknown as Blob);

      const { error: uploadErr } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(path, formData, { upsert: true });
      if (uploadErr) throw new Error(uploadErr.message);

      const { data: media, error: mediaErr } = await supabase
        .from('media_metadata')
        .upsert(
          {
            provider: 'supabase',
            bucket_name: AVATARS_BUCKET,
            file_path: path,
            file_name: fileName,
            file_size: fileSize,
            file_type: fileType,
            owner_id: userId,
            is_public: true,
          },
          { onConflict: 'owner_id,provider,file_path,file_name' },
        )
        .select('id')
        .single();
      if (mediaErr || !media) throw new Error(mediaErr?.message);

      const { error: updateErr } = await supabase
        .from('conversations')
        .update({ group_avatar_id: media.id })
        .eq('id', groupId);
      if (updateErr) throw new Error(updateErr.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
      const cacheBusted = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(cacheBusted);
      onAvatarUploaded?.(cacheBusted);

      void queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(groupId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.groups.list(),
      });
    } catch {
      setAvatarUrl(initialAvatarUrl);
      Toast.show({ type: 'error', text1: t('groups.error_generic') });
    } finally {
      setUploading(false);
    }
  }, [
    uploading,
    userId,
    groupId,
    initialAvatarUrl,
    onAvatarUploaded,
    queryClient,
    t,
  ]);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          group_name: trimmedName,
          group_description: description.trim() || null,
        })
        .eq('id', groupId);
      if (error) {
        if (error.message?.includes('character varying')) {
          throw new Error(t('validation.group_name_too_long', { max: 50 }));
        }
        throw new Error(error.message);
      }
      void queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(groupId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.groups.list(),
      });
      onClose();
    } catch {
      Toast.show({ type: 'error', text1: t('groups.error_generic') });
    } finally {
      setSaving(false);
    }
  }, [name, description, groupId, queryClient, onClose, t]);

  const canSave = name.trim().length > 0 && !saving && !uploading;

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onDismiss={onClose}
    >
      <BottomSheetView>
        <VStack className="gap-4 px-4 pb-8 pt-2">
          <Text className="font-sans text-lg font-semibold text-foreground">
            {t('groups.edit_group_info')}
          </Text>

          <View className="items-center">
            <Pressable
              onPress={handlePickAvatar}
              disabled={uploading}
              className="relative active:opacity-80"
              accessibilityLabel={t('groups.edit_name_aria')}
            >
              <Avatar uri={avatarUrl} name={name} size={80} />
              <View className="absolute -bottom-0.5 -right-0.5 h-7 w-7 items-center justify-center rounded-full border border-border bg-card shadow-sm">
                {uploading ? (
                  <ButtonSpinner className="text-muted-foreground" />
                ) : (
                  <Icon
                    as={Camera}
                    size="2xs"
                    className="text-muted-foreground"
                  />
                )}
              </View>
            </Pressable>
          </View>

          <VStack className="gap-1.5">
            <Text className="font-sans text-sm font-medium text-foreground">
              {t('groups.group_name')}
            </Text>
            <Input>
              <InputField
                value={name}
                onChangeText={setName}
                maxLength={50}
                placeholder={t('groups.create_name_placeholder')}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </Input>
          </VStack>

          <VStack className="gap-1.5">
            <Text className="font-sans text-sm font-medium text-foreground">
              {t('groups.group_description')}
            </Text>
            <Textarea>
              <TextareaField
                value={description}
                onChangeText={setDescription}
                placeholder={t('groups.create_desc_placeholder')}
                numberOfLines={3}
              />
            </Textarea>
          </VStack>

          <HStack className="justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onPress={onClose}
              disabled={saving || uploading}
            >
              <ButtonText>{t('groups.cancel')}</ButtonText>
            </Button>
            <Button size="sm" onPress={handleSave} disabled={!canSave}>
              {saving ? (
                <ButtonSpinner />
              ) : (
                <ButtonText>{t('groups.save')}</ButtonText>
              )}
            </Button>
          </HStack>
        </VStack>
      </BottomSheetView>
    </BottomSheet>
  );
}
