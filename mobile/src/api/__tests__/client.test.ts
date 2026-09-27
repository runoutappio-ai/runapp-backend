import { api, configureApiSession, publicApi, __resetApiForTests } from '../client';

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: jest.fn().mockResolvedValue(body) } as unknown as Response;
}
afterEach(() => { jest.restoreAllMocks(); __resetApiForTests(); });

it('surfaces Spring Problem Details for failed login', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue(response(401, { title: 'Unauthorized', detail: 'Email or password is incorrect.' }));
  await expect(publicApi('/api/v1/auth/login', { method: 'POST', body: '{}' })).rejects.toThrow('Email or password is incorrect.');
});

it('single-flights simultaneous token refresh and retries each request once', async () => {
  let access = 'expired'; let refresh = 'refresh-one'; let refreshCalls = 0;
  configureApiSession({ getAccessToken: () => access, getRefreshToken: () => refresh, onExpired: async () => undefined, onTokens: async (tokens) => { access = tokens.accessToken; refresh = tokens.refreshToken; } });
  globalThis.fetch = jest.fn().mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/api/v1/auth/refresh')) { refreshCalls += 1; return response(200, { accessToken: 'fresh', refreshToken: 'refresh-two', expiresIn: 300, refreshExpiresIn: 600, tokenType: 'Bearer' }); }
    const headers = init?.headers as Headers | undefined;
    return headers?.get('Authorization') === 'Bearer fresh' ? response(200, { ok: true }) : response(401, { detail: 'expired' });
  });
  const values = await Promise.all([api<{ ok: boolean }>('/one'), api<{ ok: boolean }>('/two')]);
  expect(values).toEqual([{ ok: true }, { ok: true }]); expect(refreshCalls).toBe(1); expect(refresh).toBe('refresh-two');
});
