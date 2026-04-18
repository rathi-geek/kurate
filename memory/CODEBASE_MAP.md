# Codebase Map

> Auto-generated path index. Do NOT read file contents to find paths — use this map.
> After exploring new files, update this map.

---

## libs/ (shared packages)

### libs/hooks/src/
- `index.ts` — barrel export
- `useExtractMetadata.ts` — metadata extraction hook
- `useSaveItem.ts` — save item to vault
- `useSubmitContent.ts` — route content (link vs thought) and submit

### libs/types/src/
- `index.ts` — barrel export
- `database.types.ts` — Supabase generated DB types
- `vault.ts` — VaultItem, VaultFilters, ContentType, SaveSource, filter options
- `navigation.ts` — HomeTab, VaultTab enums
- `groups.ts` — group-related types
- `people.ts` — people/DM types
- `thoughts.ts` — thought types
- `preview.ts` — preview types

### libs/query/src/
- `index.ts` — barrel export
- `client.ts` — shared query client config
- `keys.ts` — queryKeys factory (vault, feed, user, groups, people, notifications, thoughts)
- `QueryProvider.tsx` — TanStack Query provider

### libs/utils/src/
- `index.ts` — barrel export
- `slugify.ts` — slug generation
- `extract-tags.ts` — tag extraction
- `validate-username.ts` — username validation
- `constants/index.ts` — barrel
- `constants/errors.ts` — error constants
- `constants/events.ts` — analytics event constants
- `constants/interests.ts` — interest categories
- `constants/routes.ts` — route constants
- `constants/thoughts.ts` — thought bucket constants (ThoughtBucket type)

### libs/locales/src/
- `index.ts` — barrel export
- `i18n.ts` — i18n setup
- `es.ts` — Spanish translations
- `pt.ts` — Portuguese translations
- (en.json in same dir — primary English strings)

### libs/icons/src/
- `index.ts` — shared icon exports

---

## apps/web/src/

### Pages — apps/web/src/app/
- `page.tsx` — landing page
- `layout.tsx` — root layout
- `loading.tsx` — global loading
- `global-error.tsx` — global error boundary
- `robots.ts`, `sitemap.ts` — SEO

### App routes — apps/web/src/app/(app)/
- `layout.tsx` — authenticated app shell
- `home/page.tsx` — home page (vault + discovering tabs)
- `profile/page.tsx` — user profile
- `groups/page.tsx` — groups list
- `groups/[id]/page.tsx` — group detail
- `groups/[id]/GroupPageClient.tsx` — group detail client component
- `groups/join/[invite_code]/page.tsx` — join group via invite
- `groups/join/[invite_code]/JoinErrorView.tsx` — join error UI
- `people/page.tsx` — DM conversations list
- `people/[convoId]/page.tsx` — DM chat
- `notifications/page.tsx` — notifications
- `shared/page.tsx` — shared content page

### Auth — apps/web/src/app/(public)/auth/
- `layout.tsx` — auth layout
- `login/page.tsx` — login page
- `login/_components/login-form.tsx` — login form
- `login/_components/magic-link-form.tsx` — magic link form
- `_components/auth-page-shell.tsx` — auth page wrapper
- `_components/bfcache-guard.tsx` — bfcache guard
- `callback/route.ts` — OAuth callback

### Onboarding — apps/web/src/app/(onboarding)/
- `layout.tsx` — onboarding layout
- `onboarding/page.tsx` — onboarding page
- `onboarding/_components/onboarding-form.tsx`
- `onboarding/_components/interest-picker.tsx`
- `onboarding/_components/username-field.tsx`

### Admin — apps/web/src/app/(admin)/
- `layout.tsx` — admin layout
- `admin/dashboard/page.tsx` — admin dashboard
- `admin/users/page.tsx` — user management
- `_components/admin-dashboard-stats.tsx`
- `_components/admin-nav.tsx`

### API routes — apps/web/src/app/api/
- `health/route.ts` — health check
- `extract/route.ts` — URL metadata extraction
- `classify-content/route.ts` — content type classification
- `ai/chat/route.ts` — AI chat endpoint
- `backfill-interests/route.ts` — backfill user interests
- `admin/stats/route.ts` — admin statistics
- `groups/invite/route.ts` — group invite handling
- `people/conversation/route.ts` — DM conversation creation
- `thoughts/route.ts` — thoughts CRUD
- `thoughts/[id]/route.ts` — single thought operations
- `thoughts/[id]/media-url/route.ts` — thought media URL
- `thoughts/buckets/route.ts` — thought bucket summaries

### Components — apps/web/src/app/_components/

#### home/
- `home-page-client.tsx` — main home page (VAULT / DISCOVERING tabs)
- `home-tab-header.tsx` — top tab bar
- `vault-tab-view.tsx` — vault tab container (links/thoughts sub-tabs, composer, preview)
- `vault-tab-sub-header.tsx` — links/thoughts tab switcher + search + filters
- `discovering-tab-view.tsx` — discovering tab container
- `discovery-vault-section.tsx` — vault carousel in discover tab
- `discovery-new-section.tsx` — new content section in discover
- `discovery-today-section.tsx` — today section in discover
- `vault-discovery-card.tsx` — small vault card for discover section
- `chat-input.tsx` — chat-style input for vault composer
- `chat-bubble.tsx` — chat bubble component
- `LinkPreviewCard.tsx` — link preview card above composer
- `quick-chips.tsx` — quick action chips
- `thoughts-tab-view.tsx` — thoughts tab container
- `thoughts-bucket-chat.tsx` — single bucket chat view
- `thoughts/bucket-card.tsx` — bucket summary card
- `thoughts/bucket-card-skeleton.tsx` — bucket card skeleton
- `thoughts/thoughts-all-view.tsx` — all thoughts view
- `thoughts/thoughts-all-skeleton.tsx` — all thoughts skeleton
- `thoughts/utils.ts` — thought utilities

#### vault/
- `VaultLibrary.tsx` — main vault grid container (loading/error/empty + VaultGrid)
- `VaultGrid.tsx` — grid layout with infinite scroll
- `VaultCard.tsx` — vault item card (image, title, tags, actions)
- `VaultCardSkeleton.tsx` — loading skeleton
- `VaultEmptyState.tsx` — empty state
- `VaultErrorState.tsx` — error state
- `VaultFilters.tsx` — filter controls (time, type, read status)
- `VaultFilterSheet.tsx` — mobile filter sheet
- `VaultSearch.tsx` — search input
- `VaultModal.tsx` — vault item detail modal
- `VaultDeleteModal.tsx` — delete confirmation
- `VaultRemarkModal.tsx` — add/edit remark modal
- `VaultShareModal.tsx` — share to groups modal
- `PendingLinkCard.tsx` — pending/saving link card
- `ContentDNA.tsx` — content metadata display

#### groups/
- `feed-tab-view.tsx` — group feed tab
- `feed-share-card.tsx` — shared content card in feed
- `feed-header.tsx` — group feed header
- `library-view.tsx` — group library view
- `library-card.tsx` — group library card
- `comment-thread.tsx` — comment thread
- `reply-input.tsx` — reply input
- `engagement-bar.tsx` — likes/comments bar
- `drop-composer.tsx` — drop content composer
- `drop-item-preview.tsx` — drop item preview
- `create-group-dialog.tsx` — create group dialog
- `edit-group-info-modal.tsx` — edit group info
- `group-info-page.tsx` — group info page
- `group-info-header.tsx` — group info header
- `group-info-members-list.tsx` — members list
- `group-invite-modal.tsx` — invite modal
- `group-danger-zone.tsx` — danger zone (leave/delete)
- `member-action-modal.tsx` — member action modal
- `pending-group-invites-section.tsx` — pending invites

#### people/
- `dm-chat-view.tsx` — DM chat view
- `dm-composer.tsx` — DM message composer
- `find-user-sheet.tsx` — find/search user sheet
- `message-bubble.tsx` — message bubble

#### person/
- `PersonChatView.tsx` — person chat view (thread context)
- `SharedContentStrip.tsx` — shared content strip

#### threads/
- `CommentBubble.tsx` — comment bubble
- `CommentInput.tsx` — comment input
- `CommentList.tsx` — comment list
- `ThreadHeader.tsx` — thread header
- `ThreadInfoPanel.tsx` — thread info panel

#### sidebar/
- `index.ts` — barrel
- `sidebar.tsx` — main sidebar
- `sidebar-context.tsx` — sidebar context
- `sidebar-footer.tsx` — sidebar footer
- `sidebar-groups-section.tsx` — groups section
- `sidebar-people-section.tsx` — people section
- `GroupsPanel.tsx` — groups panel
- `PeoplePanel.tsx` — people panel
- `mobile-bottom-tab.tsx` — mobile bottom tab bar
- `unread-badge.tsx` — unread badge

#### reader/
- `article-reader.tsx` — article reader
- `PodcastPlayer.tsx` — podcast player
- `VideoPlayer.tsx` — video player

#### profile/
- `ProfileEditModal.tsx` — profile edit modal

#### notifications/
- `notification-item.tsx` — single notification
- `notification-panel.tsx` — notification panel

#### shared/
- `share-target-grid.tsx` — share target grid
- `url-extract-preview.tsx` — URL extraction preview

#### Other components
- `app-shell.tsx` — app shell wrapper
- `error-alert.tsx` — error alert
- `form-field.tsx` — form field
- `google-analytics.tsx` — GA
- `i18n-provider.tsx` — i18n provider
- `page-header.tsx` — page header
- `progress-bar-provider.tsx` — progress bar
- `sonner-toaster.tsx` — toast notifications
- `spinner.tsx` — spinner
- `dev/animation-preview.tsx` — dev animation preview

### Hooks — apps/web/src/app/_libs/hooks/
- `useVault.ts` — infinite vault query + delete/remarks/toggleRead mutations
- `useVaultComposer.ts` — vault input/composer state
- `useVaultPreview.ts` — link preview state (URL extraction, metadata)
- `useVaultToggle.ts` — vault read toggle
- `useVaultFilterOptions.ts` — vault filter options
- `useVaultTagCounts.ts` — vault tag counts
- `useDiscoveryVault.ts` — vault items for discovery tab
- `useDiscoveryFeed.ts` — discovery feed data
- `useContentDNA.ts` — content DNA analysis
- `useRefreshLoggedItem.ts` — refresh logged item metadata
- `useSaveItem.ts` — save item to vault
- `useShareToGroups.ts` — share vault item to groups
- `usePendingItemTimeout.ts` — pending item timeout
- `useGroupDetail.ts` — group detail
- `useGroupFeed.ts` — group feed
- `useGroupMembers.ts` — group members
- `useGroupInvites.ts` — group invites
- `useDropEngagement.ts` — drop engagement (likes/comments)
- `useComments.ts` — comments
- `useDMConversations.ts` — DM conversations
- `useMessages.ts` — DM messages
- `useNotifications.ts` — notifications
- `useUnreadCounts.ts` — unread counts
- `useLoginAuth.ts` — login auth
- `useProfileUpsert.ts` — profile upsert
- `useUserInterests.ts` — user interests
- `useUsernameAvailability.ts` — username availability
- `useBucketSummaries.ts` — thought bucket summaries
- `useBucketLastRead.ts` — bucket last read timestamp
- `useDeleteThought.ts` — delete thought
- `useEditThought.ts` — edit thought
- `usePostRead.ts` — mark post as read
- `usePostSeenStatus.ts` — post seen status
- `useDebouncedValue.ts` — debounced value
- `useSafeReducedMotion.ts` — reduced motion preference
- `useScrollDirection.ts` — scroll direction detection

### Context/utils — apps/web/src/app/_libs/
- `auth-context.tsx` — auth context provider
- `sidebar-overrides-context.tsx` — sidebar overrides
- `threadContext.tsx` — thread context (comments/replies)
- `analytics-provider.tsx` — analytics provider
- `chat-types.ts` — chat type definitions
- `contacts.ts` — contacts utilities
- `context/MediaPlayerContext.tsx` — media player context
- `db/index.ts` — Dexie (IndexedDB) for pending items
- `metadata/extractor.ts` — metadata extraction
- `supabase/client.ts` — browser supabase client
- `supabase/server.ts` — server supabase client
- `supabase/admin.ts` — admin supabase client
- `utils/cn.ts` — classnames utility
- `utils/motion.ts` — spring animation configs
- `utils/analytics.ts` — analytics tracking
- `utils/auth.ts` — auth utilities
- `utils/formatRelativeTime.ts` — relative time formatting
- `utils/fetchGroupDetail.ts` — fetch group detail (server)
- `utils/fetchShareableConversations.ts` — fetch shareable conversations
- `utils/fetchUserGroups.ts` — fetch user groups
- `utils/getLinkCopy.ts` — link copy text
- `utils/getMediaUrl.ts` — media URL resolution
- `utils/is-development-environment.ts` — env check
- `utils/mapGroupDrop.ts` — map group drop data
- `utils/validate-username.ts` — username validation

### UI components — apps/web/src/components/ui/
shadcn/ui: accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, content-type-pill, context-menu, cycling-text, dialog, drawer, dropdown-menu, form, hover-card, input-otp, input, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sliding-tabs, sonner, switch, table, tabs, textarea, toggle-group, toggle, tooltip, typewriter

### Icons — apps/web/src/components/icons/
- `index.ts` — barrel export
- `types.ts` — icon prop types
- Individual icons: apple, apple-podcasts, bell, bookmark, camera, check, chevron-down, chevron-left, close, copy, domain, dots-horizontal, double-check, exclamation-circle, external-link, eye, eye-off, google, heart, link, log-out, message-circle, pen-line, pencil, plus, reply, search, send, share, sliders, smile, spotify, star, trash, user-plus, user-x, users, vimeo, youtube

### i18n — apps/web/src/i18n/
- `index.ts`, `client.ts`, `server.ts` — i18n setup
- `use-translations.ts` — useTranslations hook
- `formatters.ts`, `formatters-server.ts` — formatters

### Other — apps/web/src/
- `hooks/use-mobile.ts` — isMobile hook
- `lib/variants.ts` — CVA variants (button, badge, input)
- `lib/motion-variants.ts` — motion variants
- `proxy.ts` — proxy setup

---

## apps/mobile-app/

### Screens — apps/mobile-app/app/
- `_layout.tsx` — root layout (providers, auth guard)
- `+html.tsx` — HTML template (web)
- `+not-found.tsx` — 404
- `modal.tsx` — modal screen

#### Tabs — apps/mobile-app/app/(tabs)/
- `_layout.tsx` — tab navigator layout
- `index.tsx` — home tab (currently: theme/language settings — **PLACEHOLDER**)
- `background-task.tsx` — background task test (**DEV ONLY**)
- `crash-test.tsx` — crash test (**DEV ONLY**)

#### Auth — apps/mobile-app/app/auth/
- `_layout.tsx` — auth layout
- `index.tsx` — auth entry (done)
- `login.tsx` — login screen (done)

#### Onboarding — apps/mobile-app/app/(onboarding)/
- `_layout.tsx` — onboarding layout
- `onboarding.tsx` — onboarding screen (done)

### Components — apps/mobile-app/components/
- `Providers.tsx` — app providers wrapper
- `QueryProvider.tsx` — TanStack Query provider
- `AnimatedSplash.tsx` — animated splash screen
- `GlobalErrorBoundary.tsx` — global error boundary
- `ErrorBoundaryCore.tsx` — error boundary core
- `ErrorFallback.tsx` — error fallback UI
- `PageErrorBoundary.tsx` — page-level error boundary
- `NetworkBanner.tsx` — offline banner
- `ExternalLink.tsx` — external link
- `StyledText.tsx` — styled text (legacy)
- `Themed.tsx` — themed components (legacy)
- `useClientOnlyValue.ts` — client-only value hook
- `useColorScheme.ts` — color scheme hook
- `useColorScheme.web.ts` — web color scheme

#### Auth components
- `auth/auth-page-shell.tsx` — auth page wrapper
- `auth/login-form.tsx` — login form
- `auth/magic-link-form.tsx` — magic link form

#### Onboarding components
- `onboarding/onboarding-form.tsx` — onboarding form
- `onboarding/interest-picker.tsx` — interest picker
- `onboarding/username-field.tsx` — username field

#### Brand
- `brand/brand-logo.tsx` — brand logo

#### UI (Gluestack)
- `ui/gluestack-ui-provider/` — Gluestack provider + config
- `ui/text/index.tsx` — Text
- `ui/view/index.tsx` — View
- `ui/safe-area-view/index.tsx` — SafeAreaView
- `ui/vstack/index.tsx` — VStack
- `ui/hstack/index.tsx` — HStack
- `ui/spinner/index.tsx` — Spinner
- `ui/pressable/index.tsx` — Pressable
- `ui/button/index.tsx` — Button
- `ui/input/index.tsx` — Input
- `ui/alert/index.tsx` — Alert
- `ui/icon/index.tsx` — Icon

### Hooks — apps/mobile-app/hooks/
- `index.ts` — barrel export
- `useAuthSession.ts` — auth session management
- `useDeepLinkAuth.ts` — deep link auth handling
- `useLoginAuth.ts` — login auth
- `useFCM.ts` — Firebase Cloud Messaging
- `useNetworkStatus.ts` — network connectivity
- `useResponsive.ts` — responsive sizing (fontSize, scale, spacing)
- `useTheme.ts` — theme hook (colors, mode)
- `useProfileUpsert.ts` — profile upsert
- `useUserInterests.ts` — user interests
- `useUsernameAvailability.ts` — username availability

### Store — apps/mobile-app/store/
- `index.ts` — barrel export
- `useAuthStore.ts` — auth store (Zustand)
- `usePersistStore.ts` — persisted store

### Context — apps/mobile-app/context/
- `index.ts` — barrel export
- `LocalizationContext.tsx` — i18n context (useLocalization)
- `ThemeContext.tsx` — theme context

### Libs — apps/mobile-app/libs/
- `supabase/client.ts` — mobile Supabase client (AsyncStorage auth)

### Utils — apps/mobile-app/utils/
- `index.ts` — barrel export
- `storageUtils.ts` — AsyncStorage utilities
- `backgroundUtils.ts` — background task utilities

---

## Mobile Screen Status

| Screen | Status | Notes |
|---|---|---|
| Auth (login) | done | Magic link + deep link |
| Onboarding | done | Username + interests |
| Home tab | **placeholder** | Currently theme/language settings |
| Background task tab | dev-only | Testing only |
| Crash test tab | dev-only | Testing only |
| Vault | **not started** | — |
| Groups | **not started** | — |
| People/DMs | **not started** | — |
| Profile | **not started** | — |
| Notifications | **not started** | — |
| Discover | **not started** | — |

---

## supabase/migrations/
- `*_initialSchema.sql` — tables, enums, RLS
- `*_functions.sql` — DB functions, triggers
- `*_seeds.sql` — seed data
