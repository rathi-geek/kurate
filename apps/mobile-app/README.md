# React Native Expo Boilerplate

A production-ready React Native boilerplate built with **Expo SDK 54**, **TypeScript**, and **Gluestack UI**. This project serves as a foundation for building scalable, cross-platform mobile applications with pre-configured best practices and essential features.

## 🚀 Features

### Core Technologies

- **React Native 0.81.5** - Cross-platform mobile development
- **Expo SDK 54** - Managed workflow with powerful tooling
- **TypeScript 5.9.2** - Type-safe development
- **React 19.1.0** - Latest React features

### Key Boilerplate Features

1.  **🔐 Local Persistent Cache & State Management**

    - **Zustand** for global state management.
    - **SecureStore** integration for persisting sensitive data (Auth) and user preferences (Theme, Language).
    - **AsyncStorage** support for caching large objects (e.g. API responses, complex JSON).
    - Optimized storage adapters: Synchronous for Auth (instant login check), Asynchronous for Preferences.

2.  **📲 Push Notifications & Crashlytics**

    - **React Native Firebase** (Messaging & Crashlytics) pre-configured.
    - **Expo Notifications** for foreground/background handling.
    - Hooks for FCM token management.

3.  **🔄 Over-the-Air (OTA) Updates**

    - **Expo Updates** configured for seamless app updates.
    - Automatic update check on launch.

4.  **🎨 Advanced Theming**

    - **Dark/Light Mode** support with system detection.
    - **Gluestack UI v4** + **NativeWind** (Tailwind CSS).
    - Dual token system: app tokens (`constants/tokens.js`), Gluestack v4 tokens (`components/ui/gluestack-ui-provider/config.ts`).

5.  **🌍 Multi-Language Support (i18n)**

    - **i18next** & **react-i18next** integrated.
    - Device locale detection by default; user can override and pick any supported language manually.
    - Language persistence (selection is saved across app restarts).

6.  **⚙️ Background Workers**

    - **Expo Task Manager** & **Background Fetch** setup for periodic tasks.

7.  **🛡️ Protected Routes**
    - **Expo Router** based navigation with Auth Guards.
    - Authentication flow (Login/Signup vs. App) separation.

### Navigation & Routing

- **Expo Router 6.0.17** - File-based routing system
- **React Navigation 7.1.8** - Flexible navigation library
- Tab-based navigation with customizable screens

### UI & Styling

- **Gluestack UI v4 alpha** - Complete component library with 40+ components
- **NativeWind 4.2.1** - Tailwind CSS for React Native
- **Tailwind CSS 3.4.13** - Utility-first CSS framework
- **React Native Reanimated 4.1.2** - Smooth animations
- **Lucide React Native** - Beautiful icon library

### Development Tools

- **PNPM 10.15.0** - Fast, disk space efficient package manager
- **ESLint** - Code linting with React Native rules
- **Prettier** - Code formatting
- **Jest** - Testing framework with Expo preset
- **TypeScript ESLint** - TypeScript-aware linting

### Additional Features

- **Dark/Light theme support** with system preference detection
- **Safe Area handling** for modern devices
- **Splash screen management**
- **Font loading** with custom fonts support
- **Web support** for cross-platform development

## 📦 UI Components (Gluestack UI v4)

This boilerplate includes **Gluestack UI v4 alpha**, a comprehensive component library with 40+ pre-built components:

### Available Components

- **Layout**: Box, VStack, HStack, Center, Divider
- **Forms**: Input, Textarea, Checkbox, Radio, Select, Slider, Switch
- **Feedback**: Alert, Toast, Progress, Spinner
- **Overlay**: Modal, Popover, Tooltip, ActionSheet, AlertDialog
- **Navigation**: Menu, Fab
- **Media**: Avatar, Image
- **Data Display**: Accordion
- **Typography**: Text components with theming
- **Interactive**: Button, Pressable, Link

### External Links

- [Gluestack UI Documentation](https://gluestack.io/)
- [Gluestack UI Components](https://ui.gluestack.io/docs/components)
- [Gluestack UI GitHub](https://github.com/gluestack/gluestack-ui)

## 🏗️ Project Structure

```
├── app/                        # Expo Router app directory (Routes)
│   ├── (tabs)/                # Main app tabs (Protected Routes)
│   │   ├── _layout.tsx        # Tab bar configuration
│   │   ├── index.tsx          # Home screen
│   │   └── background-task.tsx # Example background task screen
│   ├── _layout.tsx            # Root layout & Authentication Guard
│   ├── login.tsx              # Login screen
│   ├── signup.tsx             # Signup screen
│   ├── onboarding.tsx         # Onboarding flow
│   └── +not-found.tsx         # 404 Fallback
├── components/                # Reusable UI components
│   ├── ui/                    # Gluestack UI components (Button, Input, etc.)
│   │   └── gluestack-ui-provider/
│   │       └── config.ts      # Gluestack v4 token config (--primary, --foreground, etc.)
│   ├── ErrorBoundaryCore.tsx  # Error handling wrapper
│   └── Providers.tsx          # Global providers (Theme, Localization, UI)
├── constants/                 # App configuration & tokens
│   ├── tokens.js              # 🎨 DESIGN SYSTEM SOURCE OF TRUTH
│   ├── Colors.ts              # Generated color themes
│   └── sizeConfig.ts          # Generated spacing/sizing
├── context/                   # React Contexts
│   ├── LocalizationContext.tsx # i18n logic & persistence
│   └── ThemeContext.tsx       # Theme switching logic
├── hooks/                     # Custom hooks
│   ├── useAuthStore.ts        # (Re-export) Auth state hook
│   ├── useFCM.ts              # Firebase Cloud Messaging logic
│   ├── useTheme.ts            # Theme helper
│   └── useResponsive.ts       # Responsive layout helper
├── localization/              # Internationalization (i18n)
│   ├── en.ts                  # English translations
│   ├── es.ts                  # Spanish translations
│   ├── pt.ts                  # Portuguese translations
│   └── i18n.ts                # i18next configuration
├── store/                     # Zustand State Management
│   ├── useAuthStore.ts        # Auth state (Sync storage)
│   └── usePersistStore.ts     # User preferences (Async storage)
├── types/                     # TypeScript definitions
│   ├── enum.ts                # Enums (StorageKeys, etc.)
│   └── store.ts               # Store interfaces
├── utils/                     # Utility functions
│   ├── backgroundUtils.ts     # Background fetch tasks
│   └── storageUtils.ts        # Storage helpers
├── assets/                    # Static assets
│   ├── fonts/                 # Custom fonts
│   └── images/                # App icons & splash screens
├── scripts/                   # Build & maintenance scripts
│   └── generate-ts-from-tokens.ts # Token generator script
├── app.config.ts              # Expo Config (Env vars, Plugins)
├── global.css                 # NativeWind global styles
└── tailwind.config.js         # Tailwind Config
```

## 🧠 State Management & Storage Strategy

This project uses a hybrid storage approach optimized for both User Experience (UX) and Performance.

### 1. Synchronous Storage (`useAuthStore`)

- **Used For:** Authentication tokens, "Is Logged In" state.
- **Implementation:** `expo-secure-store` (Sync methods).
- **Why:** Critical auth state must be available _immediately_ on app launch. Using sync storage prevents the "flash of login screen" (where the user sees the login page for a split second before the app realizes they are already logged in).
- **Trade-off:** Minimal blocking of the UI thread on startup (negligible for small strings).

### 2. Asynchronous Storage (`usePersistStore`)

- **Used For:** User preferences (Theme, Language, Onboarding status).
- **Implementation:** `expo-secure-store` (Async methods via adapter).
- **Why:** These are non-critical. Loading them asynchronously ensures we never block the UI thread during app usage (e.g., when switching themes). It is the standard for general persistence.

### 3. Storage Best Practices

- **Use `expo-secure-store`** (as configured) ONLY for:
  - Small data strings (Auth tokens, simple flags).
  - Sensitive user data.
- **Use `@react-native-async-storage/async-storage`** for:
  - Large data objects.
  - Caching API responses.
  - Complex JSON structures.
  - _Reason:_ SecureStore has size limits (especially on Android) and is slower for large reads/writes.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PNPM: `npm install -g pnpm`
- Expo CLI: `pnpm add -g @expo/cli`

### ⚠️ IMPORTANT: Firebase Setup

**Before running the app**, you must add your Firebase configuration files. Without these, the app **will crash** on startup due to the Firebase module.

1.  **Android:** Place `google-services.json` in the root directory
2.  **iOS:** Place `GoogleService-Info.plist` in the root directory

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd react-native-expo-boilerplate
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start the development server**
   ```bash
   pnpm start
   ```

## 📜 Available Scripts

### Development

- `pnpm start` - Start Expo development server
- `pnpm start:clear` - Start with cache cleared
- `pnpm start:tunnel` - Start with tunnel for remote testing
- `pnpm android` - Start on Android emulator/device
- `pnpm ios` - Start on iOS simulator/device
- `pnpm web` - Start in web browser

### Building & Deployment

- `pnpm run:android` - Run native Android build
- `pnpm run:ios` - Run native iOS build
- `pnpm build:android` - Build Android APK/AAB
- `pnpm build:ios` - Build iOS app
- `pnpm build:web` - Export web build
- `pnpm prebuild` - Generate native code
- `pnpm prebuild:clean` - Clean prebuild

### Development Tools

- `pnpm test` - Run Jest tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Generate test coverage report
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm format` - Format code with Prettier
- `pnpm typecheck` - Run TypeScript type checking

### Project Management

- `pnpm install` - Expo install with compatibility checks
- `pnpm upgrade` - Upgrade Expo SDK
- `pnpm doctor` - Check project health
- `pnpm eject` - Eject from Expo managed workflow

## 🧪 Testing

Run the test suite:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

Generate coverage report:

```bash
pnpm test:coverage
```

## 🎨 Design System & Theming

This project uses a dual token system to ensure a consistent UI across the entire application.

### 1. App-Level Tokens (`constants/tokens.js`)

The source of truth for app-wide design tokens (colors, spacing, typography, etc.) is `constants/tokens.js`. These generate `Colors.ts` and `sizeConfig.ts`, used by ThemeContext, React Navigation, and custom components.

**After making changes**, run:

```bash
pnpm generate:theme
```

This regenerates `constants/Colors.ts` and `constants/sizeConfig.ts`.

### 2. Gluestack UI v4 Tokens (`components/ui/gluestack-ui-provider/config.ts`)

Gluestack v4 alpha uses its own token config with CSS variables. Token names include:

- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--background`, `--foreground`
- `--card`, `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--border`, `--input`, `--ring`
- `--popover`, `--popover-foreground`

These are used by Gluestack UI components (Button, Input, etc.)

### NativeWind (Tailwind CSS)

This project uses NativeWind for styling, which brings Tailwind CSS to React Native:

```tsx
<View className="flex-1 bg-white p-4 dark:bg-black">
  <Text className="text-xl font-bold text-gray-900 dark:text-white">
    Hello World
  </Text>
</View>
```

### Gluestack UI Components

Use pre-built components for rapid development:

```tsx
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';

export default function MyScreen() {
  return (
    <>
      <Input>
        <InputField placeholder="Enter text..." />
      </Input>
      <Button onPress={() => {}}>
        <ButtonText>Submit</ButtonText>
      </Button>
    </>
  );
}
```

## 🌓 Dark Mode Support

The app automatically detects system theme preferences and switches between light/dark modes. App themes use `constants/tokens.js` (`colors` for light, `colorsDark` for overrides). Gluestack UI uses `components/ui/gluestack-ui-provider/config.ts` (separate `light` and `dark` objects with CSS variables).

You can also manually toggle themes using the `useTheme` hook:

```tsx
const { mode, setMode } = useTheme();
// mode: 'light' | 'dark' | 'system'
// setMode('dark');
```

## 🌍 Language & Localization

The app detects the device’s local language on first launch and uses it by default. Users can override this and choose any supported language manually (e.g. English, Spanish, Portuguese). The selected language is persisted and used on the next launch.

Use the `useLocalization` hook to read the current locale and change it:

```tsx
const { locale, t, setLocale, switchToDeviceLocale } = useLocalization();
// setLocale('es');           // switch to Spanish
// switchToDeviceLocale();    // reset to device locale
```

Theme switching and language switching are both implemented and tested in `app/(tabs)/index.tsx` (Settings tab).

## 🔧 Configuration Files

- `app.json` - Expo app configuration
- `constants/tokens.js` - **Source of Truth for App Design Tokens**
- `components/ui/gluestack-ui-provider/config.ts` - **Gluestack UI v4 Tokens** (CSS variables)
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `jest.config.js` - Jest testing configuration
- `.eslintrc.js` - ESLint configuration
- `prettier.config.js` - Prettier configuration

### Configuration Guide

#### Adding a New Language

1. Create a new file in `localization/<lang>.ts`.
2. Import and add it to `localization/i18n.ts`.
3. The app will automatically pick it up.

#### Updating the Theme

- **App tokens** (ThemeContext, Navigation): Edit `constants/tokens.js`, then run `pnpm generate:theme`.
- **Gluestack UI tokens**: Edit `components/ui/gluestack-ui-provider/config.ts` (CSS variables like `--primary`, `--foreground`, etc.).

#### Managing State

- **Auth State:** Use `store/useAuthStore.ts` (Sync storage).
- **User Preferences:** Use `store/usePersistStore.ts` (Async storage).

## 🔌 Known Issues & Workarounds

### PNPM & Metro Compatibility with EAS

If you encounter issues with Metro module resolution, this project is configured to use hoisted node modules to ensure compatibility with Expo tooling.

In `.npmrc`, we set:

```ini
node-linker=hoisted
shamefully-hoist=true
```

This forces a flat `node_modules` structure, which resolves most Metro/symlink issues.

### PNPM Workspaces & Expo Router

This boilerplate is pre-configured to work seamlessly within PNPM workspaces. The necessary adjustments have already been applied:

The `metro.config.js` included is pre-configured to watch a standard workspace root, but if your monorepo structure differs (e.g., different nesting depth), **you must update the paths**:

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
// This can be replaced with `find-pnpm-workspace-root`
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Enable require.context for Expo Router
config.transformer.unstable_allowRequireContext = true;

// 2. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 3. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });
```

Ensure `workspaceRoot` correctly points to the root of your monorepo so Metro can resolve shared dependencies. After updating this please test ios and android build both in local and production using EAS. Also test OTA once.

## 📚 Useful Resources

### Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://expo.github.io/router/)
- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [NativeWind](https://www.nativewind.dev/)

### UI Libraries

- [Gluestack UI](https://gluestack.io/) - Complete component library
- [Lucide React Native](https://lucide.dev/) - Beautiful icons
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) - Animations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
