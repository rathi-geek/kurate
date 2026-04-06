import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { HomeHeader } from '@/components/home/HomeHeader';
import { VaultSubHeader } from '@/components/home/VaultSubHeader';
import { VaultSearchBar } from '@/components/vault/VaultSearchBar';
import { VaultList } from '@/components/vault/VaultList';
import {
  VaultFilterSheet,
  hasActiveFilters,
} from '@/components/vault/VaultFilterSheet';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { HomeTab, VaultTab } from '@kurate/types';
import type { VaultFilters } from '@kurate/types';

const DEFAULT_FILTER_STATE = {
  time: 'all' as const,
  contentType: 'all' as const,
  readStatus: 'all' as const,
};

export default function VaultScreen() {
  const [activeHomeTab, setActiveHomeTab] = useState(HomeTab.VAULT);
  const [vaultTab, setVaultTab] = useState(VaultTab.LINKS);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [vaultFilters, setVaultFilters] = useState(DEFAULT_FILTER_STATE);

  const debouncedSearch = useDebouncedValue(searchQuery);

  const fullFilters: VaultFilters = useMemo(
    () => ({ ...vaultFilters, search: debouncedSearch }),
    [vaultFilters, debouncedSearch],
  );

  const activeFilter = hasActiveFilters(fullFilters);

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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <HomeHeader activeTab={activeHomeTab} onTabChange={setActiveHomeTab} />
      {activeHomeTab === HomeTab.VAULT && (
        <>
          <VaultSubHeader
            vaultTab={vaultTab}
            onTabChange={setVaultTab}
            onSearchToggle={handleSearchToggle}
            onFilterPress={() => setFilterSheetOpen(true)}
            hasActiveFilter={activeFilter}
          />
          {searchOpen && (
            <VaultSearchBar
              value={searchQuery}
              onSearch={setSearchQuery}
              onClose={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
            />
          )}
          <VaultList filters={fullFilters} />
          <VaultFilterSheet
            open={filterSheetOpen}
            filters={fullFilters}
            onChange={handleFilterChange}
            onClose={() => setFilterSheetOpen(false)}
          />
        </>
      )}
    </SafeAreaView>
  );
}
