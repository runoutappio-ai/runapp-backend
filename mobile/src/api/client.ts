import { config } from '@/config';
import type { ProblemDetails, TokenResponse } from '@/types/api';

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly problem?: ProblemDetails) {
    super(message);
    this.name = 'ApiError';
  }
}

type SessionBridge = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokens: (tokens: TokenResponse) => Promise<void>;
  onExpired: () => Promise<void>;
};

let sessionBridge: SessionBridge | null = null;
let refreshPromise: Promise<string> | null = null;

export function configureApiSession(bridge: SessionBridge | null) {
  sessionBridge = bridge;
}

async function parseFailure(response: Response): Promise<ApiError> {
  let problem: ProblemDetails | undefined;
  try {
    problem = (await response.json()) as ProblemDetails;
  } catch {
    problem = undefined;
  }
  return new ApiError(problem?.detail || problem?.title || `Request failed (${response.status})`, response.status, problem);
}

async function request(url: string, init: RequestInit) {
  if (config.demoMode) {
    const { demoFetch } = await import('@/demo/server');
    return demoFetch(url, init);
  }
  try {
    return await fetch(url, init);
  } catch {
    throw new ApiError('You appear to be offline. Check your connection and try again.', 0);
  }
}

export async function publicApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await request(`${config.apiUrl}${path}`, { ...init, headers });
  if (!response.ok) throw await parseFailure(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function refreshAccessToken(): Promise<string> {
  if (!sessionBridge?.getRefreshToken()) throw new ApiError('Your session has expired.', 401);
  if (!refreshPromise) {
    refreshPromise = publicApi<TokenResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: sessionBridge.getRefreshToken() }),
    })
      .then(async (tokens) => {
        await sessionBridge?.onTokens(tokens);
        return tokens.accessToken;
      })
      .catch(async (error) => {
        await sessionBridge?.onExpired();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const token = sessionBridge?.getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await request(`${config.apiUrl}${path}`, { ...init, headers });
  if (response.status === 401 && retry && sessionBridge?.getRefreshToken()) {
    const accessToken = await refreshAccessToken();
    headers.set('Authorization', `Bearer ${accessToken}`);
    const retried = await request(`${config.apiUrl}${path}`, { ...init, headers });
    if (!retried.ok) throw await parseFailure(retried);
    if (retried.status === 204) return undefined as T;
    return (await retried.json()) as T;
  }
  if (!response.ok) throw await parseFailure(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function __resetApiForTests() {
  sessionBridge = null;
  refreshPromise = null;
}
