import type { ConfigContext, ExpoConfig } from 'expo/config';

function getAppEnv(): string {
  return process.env.APP_ENV || process.env.NODE_ENV || 'development';
}

interface AppExtra {
  appEnv: string;
  apiUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  googleWebClientId?: string;
  googleIosClientId?: string;
  eas?: { projectId: string };
  owner?: string;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = getAppEnv();
  const isProduction = appEnv === 'production' || appEnv === 'prod';

  const baseName = 'Kurate';
  const baseSlug = 'kurate';

  const name = isProduction ? baseName : `${baseName} (${appEnv})`;
  const slug = baseSlug;

  const version = '1.0.0';
  const iosBuildNumber = process.env.IOS_BUILD_NUMBER || '1';
  const androidVersionCode = parseInt(
    process.env.ANDROID_VERSION_CODE ?? '1',
    10,
  );

  const iosBundleId =
    process.env.IOS_BUNDLE_IDENTIFIER || 'com.example.mobileapp';
  const androidPackage = process.env.ANDROID_PACKAGE || 'com.example.mobileapp';
  const scheme = 'kurate';

  const extra: AppExtra = { appEnv };

  if (process.env.EXPO_PUBLIC_API_URL) {
    extra.apiUrl = process.env.EXPO_PUBLIC_API_URL;
  }
  extra.supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  extra.supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  extra.googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
  extra.googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
  extra.eas = {
    projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '',
  };
  if (process.env.EXPO_OWNER) {
    extra.owner = process.env.EXPO_OWNER;
  }

  return {
    ...config,
    owner: process.env.EXPO_OWNER,
    name,
    slug,
    version,
    scheme,
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    runtimeVersion: {
      policy: 'nativeVersion',
    },
    updates: {
      url: `https://u.expo.dev/${extra.eas.projectId}`,
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 0,
    },
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#f5f0e8',
    },
    ios: {
      supportsTablet: true,
      buildNumber: iosBuildNumber,
      bundleIdentifier: iosBundleId,
      entitlements: {
        'aps-environment': 'production',
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ['remote-notification'],
      },
    },
    android: {
      versionCode: androidVersionCode,
      package: androidPackage,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
            buildReactNativeFromSource: true,
          },
        },
      ],
      'expo-router',
      'expo-font',
      'expo-updates',
      'expo-web-browser',
      'expo-background-task',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra,
  };
};
