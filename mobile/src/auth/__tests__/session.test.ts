import * as SecureStore from 'expo-secure-store';
import { loadTokens, saveTokens } from '../token-store';
import { mapOidcTokens } from '../session';

describe('PKCE callback and session restoration', () => {
  it('requires and maps the OIDC refresh token', () => {
    expect(mapOidcTokens({ accessToken: 'access', refreshToken: 'refresh' })).toMatchObject({ accessToken: 'access', refreshToken: 'refresh' });
    expect(() => mapOidcTokens({ accessToken: 'access' })).toThrow('refresh token');
  });
  it('restores and rotates both secure tokens', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('old-access').mockResolvedValueOnce('old-refresh');
    await expect(loadTokens()).resolves.toEqual({ accessToken: 'old-access', refreshToken: 'old-refresh' });
    await saveTokens({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('runout.accessToken', 'new-access', expect.any(Object));
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('runout.refreshToken', 'new-refresh', expect.any(Object));
  });
});
