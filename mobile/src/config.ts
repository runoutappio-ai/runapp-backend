import Constants from 'expo-constants';

type AppExtra = {
  apiUrl?: string;
  keycloakUrl?: string;
  privacyUrl?: string;
  termsUrl?: string;
  demoSkipWait?: boolean;
};

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

export const config = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://localhost:8080').replace(/\/$/, ''),
  keycloakUrl: (process.env.EXPO_PUBLIC_KEYCLOAK_URL ?? extra.keycloakUrl ?? 'http://localhost:8081').replace(/\/$/, ''),
  realm: 'runout',
  clientId: 'runout-mobile',
  redirectUri: 'runout://oauth/callback',
  privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL ?? extra.privacyUrl ?? '',
  termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? extra.termsUrl ?? '',
  /** Dev-only one-tap login for the local test account (values come from .env.local). */
  testLogin: __DEV__ && process.env.EXPO_PUBLIC_TEST_LOGIN_EMAIL && process.env.EXPO_PUBLIC_TEST_LOGIN_PASSWORD
    ? { email: process.env.EXPO_PUBLIC_TEST_LOGIN_EMAIL, password: process.env.EXPO_PUBLIC_TEST_LOGIN_PASSWORD }
    : null,
  demoSkipWait: __DEV__ && (process.env.EXPO_PUBLIC_ENABLE_DEMO_SKIP_WAIT === 'true' || extra.demoSkipWait === true),
};

export const keycloakIssuer = `${config.keycloakUrl}/realms/${config.realm}`;
