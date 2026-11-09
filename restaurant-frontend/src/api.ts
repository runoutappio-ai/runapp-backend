export type ApiConfig = { baseUrl: string; token: string };

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(config: ApiConfig, path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (config.token) headers.set("Authorization", `Bearer ${config.token}`);
  const response = await fetch(`${config.baseUrl}${path}`, { ...init, headers });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json() as { detail?: string; title?: string };
      message = body.detail || body.title || message;
    } catch { /* keep status text */ }
    if (response.status === 401) window.dispatchEvent(new Event("runout:restaurant-unauthorized"));
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
