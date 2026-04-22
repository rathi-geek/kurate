import React from 'react';
import { Linking } from 'react-native';
import { Pressable } from '@/components/ui/pressable';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { useLocalization } from '@/context';

interface VaultDiscoveryCardProps {
  title: string | null;
  url: string;
  createdAt: string;
}

export const VaultDiscoveryCard = React.memo(function VaultDiscoveryCard({
  title,
  url,
  createdAt,
}: VaultDiscoveryCardProps) {
  const { t } = useLocalization();

  const domain = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  })();

  const createdMs = Date.parse(createdAt);
  const days = Number.isFinite(createdMs)
    ? Math.floor((Date.now() - createdMs) / 86_400_000)
    : null;

  const showDays = days != null;

  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      className="w-44 rounded-xl border border-border bg-card p-3"
      style={{ minHeight: 96 }}
    >
      <VStack className="flex-1 gap-1.5">
        <Text
          numberOfLines={2}
          className="font-sans text-sm font-medium leading-snug text-foreground"
          style={{ minHeight: 40 }}
        >
          {title ?? domain}
        </Text>
        <Text
          numberOfLines={1}
          className="font-sans text-xs text-muted-foreground"
        >
          {domain}
        </Text>
        {showDays ? (
          <Text className="font-sans text-xs text-muted-foreground/70">
            {t('discovery.days_ago', { count: days })}
          </Text>
        ) : null}
      </VStack>
    </Pressable>
  );
});
