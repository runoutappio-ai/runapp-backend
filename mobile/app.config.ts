import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Run Out',
  slug: 'runout-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'runout',
  userInterfaceStyle: 'dark',
  icon: './assets/images/runout-official-logo.png',
  ios: {
    bundleIdentifier: 'com.runout.mobile',
    supportsTablet: false,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Run Out uses your location to find mystery restaurants near you.',
    },
  },
  android: {
    package: 'com.runout.mobile',
    adaptiveIcon: {
      foregroundImage: './assets/images/runout-official-logo.png',
      backgroundColor: '#0D0B0C',
    },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION', 'POST_NOTIFICATIONS'],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        ios: {
          enableSceneSupport: true,
        },
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Run Out uses your location to find mystery restaurants near you.',
      },
    ],
    [
      'expo-notifications',
      {
        color: '#E6362C',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0D0B0C',
        image: './assets/images/runout-official-logo.png',
        imageWidth: 120,
      },
    ],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080',
    keycloakUrl: process.env.EXPO_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8081',
    privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL ?? '',
    termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? '',
    demoSkipWait: process.env.EXPO_PUBLIC_ENABLE_DEMO_SKIP_WAIT === 'true',
  },
});
