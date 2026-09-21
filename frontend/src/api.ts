export type ApiConfig = {
  baseUrl: string;
  token: string;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  idempotencyKey?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(config: ApiConfig, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json"
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (config.token.trim()) {
    headers.Authorization = `Bearer ${config.token.trim()}`;
  }

  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (!response.ok) {
    if (response.status === 401 && config.token.trim()) {
      window.dispatchEvent(new Event("runout:unauthorized"));
    }
    const message = await responseMessage(response);
    throw new ApiError(message || `${response.status} ${response.statusText}`, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function newIdempotencyKey() {
  return crypto.randomUUID();
}

async function responseMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (!text) {
    return "";
  }

  if (!contentType.includes("application/json")) {
    return text;
  }

  try {
    const body = JSON.parse(text) as Record<string, unknown>;
    return stringValue(body.detail)
      ?? stringValue(body.message)
      ?? stringValue(body.error_description)
      ?? stringValue(body.error)
      ?? text;
  } catch {
    return text;
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}
