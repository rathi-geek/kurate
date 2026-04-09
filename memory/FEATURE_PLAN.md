# Feature Plan: Profile
Last updated: 2026-04-09

## Feature Audit: Profile

### 1. What exists in web today
- **Profile page:** `apps/web/src/app/(app)/profile/page.tsx` — displays avatar, name, @handle, bio, interest tags, stats (saved count real, rest placeholder dashes), ContentDNA chart
- **Edit modal:** `apps/web/src/app/_components/profile/ProfileEditModal.tsx` — edit name, username, bio, interests, upload/change avatar
- **Skeleton:** `apps/web/src/app/_components/profile/ProfileSkeleton.tsx` — loading state
- **Auth context:** `apps/web/src/app/_libs/auth-context.tsx` — fetches profile + avatar URL, caches in localStorage
- **Hooks:** `useProfileUpsert.ts` (onboarding), `useUserInterests.ts`, `useUsernameAvailability.ts`
- **Utils:** `getMediaUrl.ts` (avatar URL), `validate-username.ts` (duplicate of `@kurate/utils`)

### 2. Bugs & issues to fix before mobile replicates

🔴 **Must fix:**
- **No delete avatar option** — users can upload/replace but never remove their profile picture. Need: set `avatar_id = null`, show letter fallback
- **No username validation in edit modal** — `ProfileEditModal` does NOT import or call `validateUsername`. Users can save invalid handles (spaces, special chars). Compare to `onboarding-form.tsx` which does it correctly
- **No username availability check in edit modal** — `useUsernameAvailability` is NOT used. User can save a handle already taken by someone else → silent DB error or 23505
- **No error handling on profile save** — `handleSave()` (line 150) discards `error` from `supabase.from("profiles").update(...)`. Modal closes as if it succeeded
- **No error handling on avatar upload** — `handleFileChange()` returns silently on errors (lines 102, 118). Blob URL not revoked, no user feedback
- **Avatar upload: no file size validation** — `accept="image/*"` is the only guard. No client-side size check

🟡 **Nice to fix:**
- **useUsernameAvailability flags user's OWN handle as "taken"** — queries all profiles, doesn't exclude current user. Needs `currentHandle` param

### 3. Code quality issues

🟣 **Should fix:**
- **ProfileSkeleton uses `bg-white`** (6 occurrences) — violates design system rule, must use `bg-card` (white — correct contrast against cream `bg-background` page, and semantically represents card surfaces)
- **Duplicate `validate-username.ts`** — `apps/web/src/app/_libs/utils/validate-username.ts` is identical to `libs/utils/src/validate-username.ts`. Web onboarding imports local copy, mobile imports from `@kurate/utils`. The web edit modal should import from `@kurate/utils` too
- **`useUserInterests.ts` creates supabase client at module level** (line 8) — should be inside the hook/function

### 4. What should move to /libs
- `apps/web/src/app/_libs/utils/validate-username.ts` → already exists at `libs/utils/src/validate-username.ts`
  - Reason: exact duplicate. Web onboarding files + useUsernameAvailability should import from `@kurate/utils` instead

### 5. What mobile needs to build fresh
- `apps/mobile-app/app/(tabs)/profile.tsx` — profile screen (new tab)
- `apps/mobile-app/components/profile/profile-view.tsx` — profile display component
- `apps/mobile-app/components/profile/profile-edit-sheet.tsx` — edit profile bottom sheet
- `apps/mobile-app/components/profile/avatar-upload.tsx` — avatar upload + delete component
- `apps/mobile-app/hooks/useProfile.ts` — fetch profile data hook
- Update `apps/mobile-app/app/(tabs)/_layout.tsx` — add Profile tab

---

## Order of execution (always follow this sequence)
1. Web — fix bugs
2. Web — code quality
3. Web — move to /libs (remove duplicate)
4. Mobile — build profile feature

---

## Web — Step by Step

### Step 1: Fix bugs — Add delete avatar to ProfileEditModal
File: `apps/web/src/app/_components/profile/ProfileEditModal.tsx`
- Add `handleDeleteAvatar()`: sets `profiles.avatar_id = null`, calls `refreshUser()`, toasts
- Add "Remove photo" text button below avatar (only visible when avatar exists)
- Add AlertDialog confirmation before deleting (import from `@/components/ui/alert-dialog`)
- Add `deletingAvatar` state, update `busy` computed

### Step 2: Fix bugs — Add username validation to edit modal
File: `apps/web/src/app/_components/profile/ProfileEditModal.tsx`
- Import `validateUsername` from `@kurate/utils`
- Import `useUsernameAvailability` from `@/app/_libs/hooks/useUsernameAvailability`
- On username `onChange`: lowercase, strip spaces, run `validateUsername()`, set error
- Show status indicator (checking/available/taken) below username field
- Update `canSave` to block on validation errors + `taken` + `checking`

File: `apps/web/src/app/_libs/hooks/useUsernameAvailability.ts`
- Add optional `currentHandle` param
- Skip DB check when `trimmed === currentHandle` → set `"available"` directly

### Step 3: Fix bugs — Add error handling to save & upload
File: `apps/web/src/app/_components/profile/ProfileEditModal.tsx`
- `handleSave()`: check `error` from update, `toast.error(t("save_error"))` on failure
- `handleFileChange()`: add 5MB max size check, revoke blob + restore previous URL + toast on upload/media errors

### Step 4: Fix bugs — Add translation keys
File: `libs/locales/src/en.json` (profile section)
- Add: `remove_photo`, `remove_photo_title`, `remove_photo_desc`, `remove_photo_confirm`, `avatar_deleted`, `avatar_delete_error`, `save_error`, `upload_error`, `upload_size_error`, `username_taken`, `username_checking`, `username_available`

### Step 5: Code quality — Fix ProfileSkeleton
File: `apps/web/src/app/_components/profile/ProfileSkeleton.tsx`
- Replace all `bg-white` (6 occurrences) with `bg-card`

### Step 6: Code quality — Remove duplicate validate-username
File: `apps/web/src/app/_libs/hooks/useUsernameAvailability.ts`
- Change import from `@/app/_libs/utils/validate-username` to `@kurate/utils`

File: `apps/web/src/app/(onboarding)/onboarding/_components/onboarding-form.tsx`
- Change import from `@/app/_libs/utils/validate-username` to `@kurate/utils`

File: `apps/web/src/app/(onboarding)/onboarding/_components/username-field.tsx`
- Change import from `@/app/_libs/utils/validate-username` to `@kurate/utils`

Then delete: `apps/web/src/app/_libs/utils/validate-username.ts`

### Step 7: Code quality — Fix module-level supabase client
File: `apps/web/src/app/_libs/hooks/useUserInterests.ts`
- Move `const supabase = createClient()` inside `useUserInterests` queryFn and inside `saveUserInterests`

---

## Mobile — Step by Step

### Step 1: Add profile hook
New file: `apps/mobile-app/hooks/useProfile.ts`
Read for reference:
- `apps/web/src/app/_libs/auth-context.tsx` — profile fetch query shape (line 70-74)
- `libs/query/src/keys.ts` — queryKeys.user.profile
Build instructions:
- Create `useProfile(userId)` hook using TanStack Query
- Fetch: `profiles.select("first_name, last_name, handle, about, is_onboarded, avatar:avatar_id(file_path, bucket_name)")`
- Resolve avatar URL from `file_path` + `bucket_name` (use env SUPABASE_URL)
- Return `{ profile, isLoading, error, refetch }`

### Step 2: Add profile view component
New file: `apps/mobile-app/components/profile/profile-view.tsx`
Read for reference:
- `apps/web/src/app/(app)/profile/page.tsx` — layout: avatar (64px circle, letter fallback), name, @handle, bio, interest tags, stats grid
- `apps/mobile-app/CLAUDE.md` — Gluestack components, NativeWind classes, semantic tokens
Key design decisions from web:
- Avatar: 64px circle with `bg-primary`, letter fallback `text-primary-foreground text-2xl font-bold`
- Stats: 5-column grid (saved/read/shared/following/trust score) — adapt to horizontal scroll or 3+2 grid on mobile
- Interest tags: `bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs`
- Edit button: subtle border pill next to name
Build instructions:
- Use `VStack`, `HStack`, `Text`, `Pressable` from Gluestack
- Avatar with RN `Image`
- Interests as horizontal `FlatList` or flex-wrap
- All strings via `useLocalization`

### Step 3: Add profile edit bottom sheet
New file: `apps/mobile-app/components/profile/profile-edit-sheet.tsx`
Read for reference:
- `apps/web/src/app/_components/profile/ProfileEditModal.tsx` — fields: avatar upload, name, username (with validation + availability), bio, interests
- `apps/mobile-app/components/onboarding/onboarding-form.tsx` — username validation + availability pattern for mobile
- `apps/mobile-app/components/onboarding/username-field.tsx` — mobile username field component (reuse)
- `apps/mobile-app/components/onboarding/interest-picker.tsx` — mobile interest picker (reuse)
Key design decisions from web:
- Modal sections: avatar → name → username → bio → interests → save/cancel buttons
- Avatar: camera overlay on hover → on mobile use Pressable with camera icon overlay
- Username: real-time validation + availability check (debounced 500ms)
- Save button disabled when name/username empty or username invalid/taken
Build instructions:
- Use bottom sheet or modal pattern
- Reuse `UsernameField` and `InterestPicker` from onboarding
- Add avatar upload via `expo-image-picker`
- Add "Remove photo" option (same as web: set avatar_id to null)
- Add bio `TextInput` (missing from onboarding)
- Handle save: update profiles table + saveUserInterests + refetch profile

### Step 4: Add avatar upload component
New file: `apps/mobile-app/components/profile/avatar-upload.tsx`
Read for reference:
- `apps/web/src/app/_components/profile/ProfileEditModal.tsx` — upload flow (lines 86-127): file → storage → media_metadata → profiles.avatar_id
Build instructions:
- Use `expo-image-picker` for `launchImageLibraryAsync`
- Upload to Supabase storage: `avatars/profile_avatars/{userId}.{ext}`
- Upsert `media_metadata` record
- Update `profiles.avatar_id`
- Include "Remove photo" button with confirmation alert (`Alert.alert`)
- 5MB max file size validation

### Step 5: Add Profile tab to navigation
File: `apps/mobile-app/app/(tabs)/_layout.tsx`
- Add new `Tabs.Screen` for `profile` tab
- Use `User` icon from `lucide-react-native`
- All strings via `useLocalization`

New file: `apps/mobile-app/app/(tabs)/profile.tsx`
- Thin screen: uses `useProfile` hook + renders `ProfileView`
- Shows `ProfileEditSheet` on edit button press

### Step 6: Add translation keys for mobile
File: `libs/locales/src/en.json`
- Add mobile-specific profile keys if not already covered by web Step 4
- Keys needed: `profile.title`, `profile.edit_btn`, stats, edit fields, remove photo, errors (most already added in web step)

---

## Next Commands

**Web agent:**
"Read memory/CODEBASE_MAP.md and memory/FEATURE_PLAN.md.
Follow Web Steps 1-7 exactly as written in the plan.

Files to fix:
- `apps/web/src/app/_components/profile/ProfileEditModal.tsx` — delete avatar, username validation, error handling
- `apps/web/src/app/_libs/hooks/useUsernameAvailability.ts` — add currentHandle param
- `apps/web/src/app/_components/profile/ProfileSkeleton.tsx` — fix bg-white tokens
- `libs/locales/src/en.json` — add translation keys
- `apps/web/src/app/_libs/hooks/useUserInterests.ts` — fix module-level client

Context files (read for understanding only):
- `apps/web/src/app/(app)/profile/page.tsx`
- `apps/web/src/app/_libs/auth-context.tsx`
- `apps/web/src/app/_libs/utils/getMediaUrl.ts`
- `apps/web/src/components/ui/alert-dialog.tsx`
- `libs/utils/src/validate-username.ts`

Files to update imports:
- `apps/web/src/app/_libs/hooks/useUsernameAvailability.ts` — import from @kurate/utils
- `apps/web/src/app/(onboarding)/onboarding/_components/onboarding-form.tsx` — import from @kurate/utils
- `apps/web/src/app/(onboarding)/onboarding/_components/username-field.tsx` — import from @kurate/utils

File to delete:
- `apps/web/src/app/_libs/utils/validate-username.ts`

Run `pnpm lint` and `pnpm type:check` when done."

**Mobile agent:**
"Read memory/CODEBASE_MAP.md and memory/FEATURE_PLAN.md.
Follow Mobile Steps 1-6 in order as written in the plan.

Shared libs:
- `libs/query/src/keys.ts` — queryKeys
- `libs/utils/src/validate-username.ts` — username validation
- `libs/utils/src/constants/interests.ts` — INTEREST_OPTIONS
- `libs/locales/src/en.json` — translation keys
- `libs/types/src/database.types.ts` — DB types

Web reference (design + logic):
- `apps/web/src/app/(app)/profile/page.tsx` — profile layout
- `apps/web/src/app/_components/profile/ProfileEditModal.tsx` — edit modal fields + avatar upload flow
- `apps/web/src/app/_libs/auth-context.tsx` — profile fetch shape

Existing mobile files:
- `apps/mobile-app/app/(tabs)/_layout.tsx` — add profile tab here
- `apps/mobile-app/hooks/useProfileUpsert.ts` — reference for mobile Supabase pattern
- `apps/mobile-app/hooks/useUsernameAvailability.ts` — reuse for edit
- `apps/mobile-app/hooks/useUserInterests.ts` — reuse for edit
- `apps/mobile-app/components/onboarding/onboarding-form.tsx` — reuse pattern
- `apps/mobile-app/components/onboarding/username-field.tsx` — reuse component
- `apps/mobile-app/components/onboarding/interest-picker.tsx` — reuse component
- `apps/mobile-app/store/useAuthStore.ts` — auth state
- `apps/mobile-app/libs/supabase/client.ts` — mobile Supabase client

Run `pnpm lint` and `pnpm format` when done."
