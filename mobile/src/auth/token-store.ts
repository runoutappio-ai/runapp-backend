import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { TokenResponse } from '@/types/api';

const ACCESS_TOKEN = 'runout.accessToken';
const REFRESH_TOKEN = 'runout.refreshToken';

export type StoredTokens = Pick<TokenResponse, 'accessToken' | 'refreshToken'>;

const isWeb = Platform.OS === 'web';

function webStorage() {
  // `localStorage` is intentionally used only for the browser demo. Native
  // builds continue to keep tokens in the device keychain via SecureStore.
  return typeof window !== 'undefined' ? window.localStorage : null;
}

export async function loadTokens(): Promise<StoredTokens | null> {
  if (isWeb) {
    const storage = webStorage();
    const accessToken = storage?.getItem(ACCESS_TOKEN) ?? null;
    const refreshToken = storage?.getItem(REFRESH_TOKEN) ?? null;
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  }
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN),
    SecureStore.getItemAsync(REFRESH_TOKEN),
  ]);
  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
}

export async function saveTokens(tokens: StoredTokens) {
  if (isWeb) {
    const storage = webStorage();
    storage?.setItem(ACCESS_TOKEN, tokens.accessToken);
    storage?.setItem(REFRESH_TOKEN, tokens.refreshToken);
    return;
  }
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN, tokens.accessToken, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
    SecureStore.setItemAsync(REFRESH_TOKEN, tokens.refreshToken, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
  ]);
}

export async function clearTokens() {
  if (isWeb) {
    const storage = webStorage();
    storage?.removeItem(ACCESS_TOKEN);
    storage?.removeItem(REFRESH_TOKEN);
    return;
  }
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN),
    SecureStore.deleteItemAsync(REFRESH_TOKEN),
  ]);
}
