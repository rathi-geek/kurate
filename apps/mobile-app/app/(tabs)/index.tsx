import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { View } from '@/components/ui/view';
import { HomeHeader } from '@/components/home/HomeHeader';
import { VaultSubHeader } from '@/components/home/VaultSubHeader';
import { ChatComposer } from '@/components/home/ChatComposer';
import { LinkPreviewCard } from '@/components/home/LinkPreviewCard';
import { VaultList } from '@/components/vault/VaultList';
import {
  VaultFilterSheet,
  hasActiveFilters,
} from '@/components/vault/VaultFilterSheet';
import { ThoughtsTabView } from '@/components/thoughts/ThoughtsTabView';
import { useExtractMetadata } from '@/hooks/useExtractMetadata';
import { useShareToGroups } from '@/hooks/useShareToGroups';
import { supabase } from '@/libs/supabase/client';
import { useSubmitContent } from '@kurate/hooks';
import type { SaveItemResult } from '@kurate/hooks';
import { HomeTab, VaultTab, PreviewPhase } from '@kurate/types';
import type { VaultFilters } from '@kurate/types';

const DEFAULT_FILTER_STATE: Omit<VaultFilters, 'search'> = {
  time: 'all',
  contentType: 'all',
  readStatus: 'all',
};

const apiBaseUrl =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? '';

export default function VaultScreen() {
  const queryClient = useQueryClient();
  const [activeHomeTab, setActiveHomeTab] = useState(HomeTab.VAULT);
  const [vaultTab, setVaultTab] = useState(VaultTab.LINKS);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [vaultFilters, setVaultFilters] = useState(DEFAULT_FILTER_STATE);

  // Link preview state
  const [previewPhase, setPreviewPhase] = useState(PreviewPhase.Idle);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savedLoggedItemId, setSavedLoggedItemId] = useState<string | null>(
    null,
  );
  const [savedItemGroups, setSavedItemGroups] = useState<string[]>([]);

  const {
    isExtracting,
    metadata: extractedMeta,
    extractionFailed,
    extract,
    reset: resetExtraction,
  } = useExtractMetadata();
  const shareMutation = useShareToGroups();

  const fullFilters: VaultFilters = useMemo(
    () => ({ ...vaultFilters, search: searchQuery }),
    [vaultFilters, searchQuery],
  );

  const activeFilter = hasActiveFilters(fullFilters);

  // Transition from Loading → Loaded when extraction finishes
  useEffect(() => {
    if (previewPhase === PreviewPhase.Loading && !isExtracting) {
      setPreviewPhase(PreviewPhase.Loaded);
    }
  }, [isExtracting, previewPhase]);

  const handleLinkSaved = useCallback(async (result: SaveItemResult) => {
    if (result.status === 'saved' && result.item) {
      setSavedLoggedItemId(result.item.logged_item_id);
      setPreviewPhase(PreviewPhase.Share);
    }
  }, []);

  const { onSend } = useSubmitContent({
    supabase,
    queryClient,
    apiBaseUrl,
    onRouted: dest =>
      setVaultTab(dest === 'links' ? VaultTab.LINKS : VaultTab.THOUGHTS),
    onLinkSaved: handleLinkSaved,
  });

  const resetPreview = useCallback(() => {
    setPreviewPhase(PreviewPhase.Idle);
    setPreviewUrl(null);
    setSavedLoggedItemId(null);
    setSavedItemGroups([]);
    resetExtraction();
  }, [resetExtraction]);

  const handleUrlChange = useCallback(
    (url: string | null) => {
      if (url) {
        setPreviewUrl(url);
        setPreviewPhase(PreviewPhase.Loading);
        extract(url);
      } else if (previewPhase === PreviewPhase.Loading) {
        resetPreview();
      }
    },
    [extract, previewPhase, resetPreview],
  );

  const handlePreviewShare = useCallback(
    async (groupIds: string[]) => {
      if (!savedLoggedItemId) return;
      await shareMutation.mutateAsync({
        loggedItemId: savedLoggedItemId,
        conversationIds: groupIds,
      });
      setSavedItemGroups(prev => [...prev, ...groupIds]);
      resetPreview();
    },
    [savedLoggedItemId, shareMutation, resetPreview],
  );

  const handleSearchToggle = useCallback(() => {
    setSearchOpen(prev => {
      if (prev) setSearchQuery('');
      return !prev;
    });
  }, []);

  const handleFilterChange = useCallback((f: VaultFilters) => {
    setVaultFilters({
      time: f.time,
      contentType: f.contentType,
      readStatus: f.readStatus,
    });
  }, []);

  const handleComposerSend = useCallback(
    async (text: string) => {
      await onSend(text);
    },
    [onSend],
  );

  const { bottom } = useSafeAreaInsets();
  const bottomPadding = Math.max(bottom / 2, 4);

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={['top', 'left', 'right']}
      style={{ paddingBottom: bottomPadding }}
    >
      <HomeHeader activeTab={activeHomeTab} onTabChange={setActiveHomeTab} />
      {activeHomeTab === HomeTab.VAULT && (
        <View className="flex-1">
          <VaultSubHeader
            vaultTab={vaultTab}
            onTabChange={setVaultTab}
            searchOpen={searchOpen}
            onSearchToggle={handleSearchToggle}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onFilterPress={() => setFilterSheetOpen(true)}
            hasActiveFilter={activeFilter}
          />
          <View className="flex-1">
            {vaultTab === VaultTab.LINKS ? (
              <VaultList filters={fullFilters} />
            ) : (
              <ThoughtsTabView searchQuery={searchQuery} />
            )}
          </View>
          {previewPhase !== PreviewPhase.Idle && previewUrl && (
            <LinkPreviewCard
              phase={previewPhase as Exclude<PreviewPhase, PreviewPhase.Idle>}
              url={previewUrl}
              metadata={extractedMeta}
              extractionFailed={extractionFailed}
              savedItemGroups={savedItemGroups}
              onClose={resetPreview}
              onShare={handlePreviewShare}
              onSkip={resetPreview}
            />
          )}
          <KeyboardStickyView>
            <ChatComposer
              onSend={handleComposerSend}
              onUrlChange={handleUrlChange}
              collapsible={vaultTab === VaultTab.THOUGHTS}
            />
          </KeyboardStickyView>
          {vaultTab === VaultTab.LINKS && (
            <VaultFilterSheet
              open={filterSheetOpen}
              filters={fullFilters}
              onChange={handleFilterChange}
              onClose={() => setFilterSheetOpen(false)}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
