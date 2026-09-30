import Constants from 'expo-constants';

type AppExtra = {
  apiUrl?: string;
  keycloakUrl?: string;
  privacyUrl?: string;
  termsUrl?: string;
  demoSkipWait?: boolean;
};

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

/** Web demo build: every API call is answered in the browser by src/demo/server.ts (no backend needed). */
const demoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

export const config = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://localhost:8080').replace(/\/$/, ''),
  keycloakUrl: (process.env.EXPO_PUBLIC_KEYCLOAK_URL ?? extra.keycloakUrl ?? 'http://localhost:8081').replace(/\/$/, ''),
  realm: 'runout',
  clientId: 'runout-mobile',
  redirectUri: 'runout://oauth/callback',
  privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL ?? extra.privacyUrl ?? '',
  termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? extra.termsUrl ?? '',
  demoMode,
  /** One-tap login: the shared demo account in demo builds, otherwise the dev-only test account from .env.local. */
  testLogin: demoMode
    ? { email: 'demo@runout.app', password: 'demo' }
    : __DEV__ && process.env.EXPO_PUBLIC_TEST_LOGIN_EMAIL && process.env.EXPO_PUBLIC_TEST_LOGIN_PASSWORD
    ? { email: process.env.EXPO_PUBLIC_TEST_LOGIN_EMAIL, password: process.env.EXPO_PUBLIC_TEST_LOGIN_PASSWORD }
    : null,
  demoSkipWait: demoMode || __DEV__ && (process.env.EXPO_PUBLIC_ENABLE_DEMO_SKIP_WAIT === 'true' || extra.demoSkipWait === true),
};

export const keycloakIssuer = `${config.keycloakUrl}/realms/${config.realm}`;
