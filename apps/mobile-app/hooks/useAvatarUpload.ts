import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kurate/query';
import { uploadAvatarFromUri, deleteAvatar } from '@kurate/hooks';

import { supabase } from '@/libs/supabase/client';

import type { ProfileData } from './useProfile';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function updateProfileCache(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  avatarUrl: string | null,
) {
  queryClient.setQueryData<ProfileData>(queryKeys.user.profile(userId), old =>
    old ? { ...old, avatarUrl } : old,
  );
}

export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const pickAndUpload = useCallback(
    async (userId: string): Promise<string | null> => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return null;

      const asset = result.assets[0];
      const fileSize = asset.fileSize ?? 0;
      if (fileSize > MAX_FILE_SIZE) {
        Alert.alert('', 'Image must be under 5 MB');
        return null;
      }

      const localUri = asset.uri;

      // Optimistic: show local image instantly everywhere
      updateProfileCache(queryClient, userId, localUri);

      // Upload in background
      setUploading(true);
      const fileName = asset.fileName ?? `avatar.${localUri.split('.').pop()}`;
      const fileType = asset.mimeType ?? 'image/jpeg';

      uploadAvatarFromUri(
        supabase,
        userId,
        localUri,
        fileName,
        fileType,
        fileSize,
      )
        .then(remoteUrl => {
          updateProfileCache(queryClient, userId, remoteUrl);
        })
        .catch(err => {
          console.error('[avatar] upload failed:', err);
          queryClient.invalidateQueries({
            queryKey: queryKeys.user.profile(userId),
          });
        })
        .finally(() => setUploading(false));

      return localUri;
    },
    [queryClient],
  );

  const handleDeleteAvatar = useCallback(
    async (userId: string, t: (key: string) => string): Promise<boolean> => {
      return new Promise(resolve => {
        Alert.alert(
          t('profile.remove_photo_title'),
          t('profile.remove_photo_desc'),
          [
            {
              text: t('profile.confirm_logout_cancel'),
              onPress: () => resolve(false),
            },
            {
              text: t('profile.remove_photo_confirm'),
              style: 'destructive',
              onPress: async () => {
                // Optimistic: clear avatar instantly
                updateProfileCache(queryClient, userId, null);

                setUploading(true);
                try {
                  await deleteAvatar(supabase, userId);
                  resolve(true);
                } catch {
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.user.profile(userId),
                  });
                  Alert.alert('', t('profile.avatar_delete_error'));
                  resolve(false);
                } finally {
                  setUploading(false);
                }
              },
            },
          ],
        );
      });
    },
    [queryClient],
  );

  return {
    uploading,
    pickAndUpload,
    deleteAvatar: handleDeleteAvatar,
  };
}
