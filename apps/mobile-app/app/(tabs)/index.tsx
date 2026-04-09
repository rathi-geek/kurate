import { useCallback, useMemo, useState } from 'react';
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
import { useVaultPreview } from '@/hooks/useVaultPreview';
import { useVaultComposer } from '@/hooks/useVaultComposer';
import { useShareToGroups } from '@/hooks/useShareToGroups';
import { supabase } from '@/libs/supabase/client';
import { useSubmitContent } from '@kurate/hooks';
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
  const { bottom } = useSafeAreaInsets();
  const bottomPadding = Math.max(bottom / 2, 4);

  // --- Simple tab-level state ---
  const [activeHomeTab, setActiveHomeTab] = useState(HomeTab.VAULT);
  const [vaultTab, setVaultTab] = useState(VaultTab.LINKS);
  const [vaultFilters, setVaultFilters] = useState(DEFAULT_FILTER_STATE);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [thoughtsViewAll, setThoughtsViewAll] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  const resetInput = useCallback(() => setInputKey(k => k + 1), []);

  const fullFilters: VaultFilters = useMemo(
    () => ({ ...vaultFilters, search: searchQuery }),
    [vaultFilters, searchQuery],
  );
  const activeFilter = hasActiveFilters(fullFilters);

  // --- Shared hooks (from libs via wrappers) ---
  const preview = useVaultPreview(resetInput);

  const { onSend } = useSubmitContent({
    supabase,
    queryClient,
    apiBaseUrl,
    onRouted: dest => {
      setVaultTab(dest === 'links' ? VaultTab.LINKS : VaultTab.THOUGHTS);
    },
    onLinkSaved: preview.handleLinkSaved,
  });

  const { handleVaultChatSend } = useVaultComposer({
    preview,
    onSend,
    tab: {
      vaultTab,
      setVaultTab,
      activeBucket: null,
      onThoughtViewAllChange: setThoughtsViewAll,
    },
    resetInput,
  });

  const shareMutation = useShareToGroups();

  // --- Simple handlers ---
  const handleTabChange = useCallback((tab: VaultTab) => {
    setVaultTab(tab);
    setSearchQuery('');
    setSearchOpen(false);
    if (tab === VaultTab.LINKS) setThoughtsViewAll(false);
  }, []);

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

  const handleShare = useCallback(
    async (groupIds: string[]) => {
      if (!preview.savedLoggedItemId || groupIds.length === 0) return;
      await shareMutation.mutateAsync({
        loggedItemId: preview.savedLoggedItemId,
        conversationIds: groupIds,
      });
      preview.setSavedItemGroups(prev => [...new Set([...prev, ...groupIds])]);
      preview.resetPreviewState();
      preview.resetExtraction();
      resetInput();
    },
    [preview, shareMutation, resetInput],
  );

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
            onTabChange={handleTabChange}
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
              <ThoughtsTabView
                searchQuery={searchQuery}
                viewAll={thoughtsViewAll}
                onViewAllChange={setThoughtsViewAll}
              />
            )}
          </View>
          {preview.previewPhase !== PreviewPhase.Idle && (
            <LinkPreviewCard
              phase={
                preview.previewPhase as Exclude<PreviewPhase, PreviewPhase.Idle>
              }
              url={preview.previewUrl ?? preview.lastSentUrl ?? ''}
              metadata={preview.previewMeta ?? undefined}
              extractionFailed={preview.extractionFailed}
              savedItemGroups={preview.savedItemGroups}
              onClose={preview.handlePreviewClose}
              onShare={handleShare}
              onSkip={preview.handleSkip}
            />
          )}
          <KeyboardStickyView>
            <ChatComposer
              key={inputKey}
              onSend={handleVaultChatSend}
              onUrlChange={preview.handleUrlChange}
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
