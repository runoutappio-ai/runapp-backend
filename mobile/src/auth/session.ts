import type { TokenResponse } from '@/types/api';

export function mapOidcTokens(input: { accessToken: string; refreshToken?: string; expiresIn?: number; tokenType?: string }): TokenResponse {
  if (!input.refreshToken) throw new Error('The identity provider did not return a refresh token.');
  return { accessToken: input.accessToken, refreshToken: input.refreshToken, expiresIn: input.expiresIn ?? 0, refreshExpiresIn: 0, tokenType: input.tokenType ?? 'Bearer' };
}
