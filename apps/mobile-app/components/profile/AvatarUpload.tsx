import { Image } from 'react-native';
import { Camera, Trash2 } from 'lucide-react-native';

import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';

interface AvatarUploadProps {
  avatarUrl: string | null;
  displayName: string;
  uploading: boolean;
  onPickImage: () => void;
  onDeleteAvatar: () => void;
}

export function AvatarUpload({
  avatarUrl,
  displayName,
  uploading,
  onPickImage,
  onDeleteAvatar,
}: AvatarUploadProps) {
  const letter = displayName ? displayName[0].toUpperCase() : '?';

  return (
    <View className="items-center">
      <View className="relative">
        <Pressable onPress={onPickImage} disabled={uploading}>
          <View className="h-16 w-16 overflow-hidden rounded-full bg-primary">
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                className="h-full w-full rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="flex h-full w-full items-center justify-center">
                <Text className="font-sans text-2xl font-bold text-primary-foreground">
                  {letter}
                </Text>
              </View>
            )}
            <View className="absolute inset-0 items-center justify-center rounded-full bg-black/30">
              {uploading ? (
                <Spinner className="text-white" />
              ) : (
                <Camera size={16} color="white" />
              )}
            </View>
          </View>
        </Pressable>

        {!!avatarUrl && !uploading ? (
          <Pressable
            onPress={onDeleteAvatar}
            className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-card shadow-sm"
          >
            <Trash2 size={12} className="text-muted-foreground" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
