import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { configureApiSession, api, publicApi } from '@/api/client';
import { queryClient } from '@/api/query';
import { config, keycloakIssuer } from '@/config';
import type { TokenResponse, User } from '@/types/api';
import { clearTokens, loadTokens, saveTokens } from './token-store';
import { mapOidcTokens } from './session';
import { identityProviders } from './providers';

WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  busy: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const tokensRef = useRef<TokenResponse | null>(null);
  const discovery = AuthSession.useAutoDiscovery(keycloakIssuer);
  const redirectUri = AuthSession.makeRedirectUri({ native: config.redirectUri });
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: config.clientId,
      redirectUri,
      scopes: ['openid', 'email', 'profile'],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: identityProviders.google.authorizationParams,
    },
    discovery,
  );

  const applyTokens = useCallback(async (tokens: TokenResponse) => {
    tokensRef.current = tokens;
    await saveTokens(tokens);
  }, []);

  const expire = useCallback(async () => {
    tokensRef.current = null;
    setUser(null);
    queryClient.removeQueries({ queryKey: ['reservations'] });
    queryClient.removeQueries({ queryKey: ['profile'] });
    await clearTokens();
  }, []);

  useEffect(() => {
    configureApiSession({
      getAccessToken: () => tokensRef.current?.accessToken ?? null,
      getRefreshToken: () => tokensRef.current?.refreshToken ?? null,
      onTokens: applyTokens,
      onExpired: expire,
    });
    return () => configureApiSession(null);
  }, [applyTokens, expire]);

  const reloadUser = useCallback(async () => {
    const current = await api<User>('/api/v1/users/me');
    setUser(current);
  }, []);

  useEffect(() => {
    void (async () => {
      const stored = await loadTokens();
      if (stored) {
        tokensRef.current = { ...stored, expiresIn: 0, refreshExpiresIn: 0, tokenType: 'Bearer' };
        try {
          await reloadUser();
        } catch {
          await expire();
        }
      }
      setReady(true);
    })();
  }, [expire, reloadUser]);

  useEffect(() => {
    if (response?.type !== 'success' || !request?.codeVerifier || !discovery) return;
    void (async () => {
      setBusy(true);
      try {
        const exchanged = await AuthSession.exchangeCodeAsync(
          {
            clientId: config.clientId,
            code: response.params.code,
            redirectUri,
            extraParams: { code_verifier: request.codeVerifier! },
          },
          discovery,
        );
        await applyTokens(mapOidcTokens(exchanged));
        await api<User>('/api/v1/users/me/provision', { method: 'POST' });
        await reloadUser();
      } finally {
        setBusy(false);
      }
    })();
  }, [applyTokens, discovery, redirectUri, reloadUser, request?.codeVerifier, response]);

  const signIn = useCallback(async (email: string, password: string) => {
    setBusy(true);
    try {
      const tokens = await publicApi<TokenResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await applyTokens(tokens);
      await reloadUser();
    } finally {
      setBusy(false);
    }
  }, [applyTokens, reloadUser]);

  const register = useCallback(async (displayName: string, email: string, password: string) => {
    setBusy(true);
    try {
      await publicApi('/api/v1/users/registrations', {
        method: 'POST',
        body: JSON.stringify({ displayName, email, password }),
      });
      const tokens = await publicApi<TokenResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await applyTokens(tokens);
      await reloadUser();
    } finally {
      setBusy(false);
    }
  }, [applyTokens, reloadUser]);

  const signOut = useCallback(async () => {
    try {
      await api('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // A guest transition must still succeed when the access token is already expired.
    } finally {
      await expire();
    }
  }, [expire]);

  const signInWithGoogle = useCallback(async () => {
    if (!request || !discovery) throw new Error('Google sign-in is still loading. Please try again.');
    await promptAsync();
  }, [discovery, promptAsync, request]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    ready,
    busy,
    signIn,
    register,
    signInWithGoogle,
    signOut,
    reloadUser,
  }), [busy, ready, register, reloadUser, signIn, signInWithGoogle, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
