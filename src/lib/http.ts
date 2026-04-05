export class OsmApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "OsmApiError";
    this.statusCode = statusCode;
  }
}

interface RequestOptions {
  url: string;
  method: "GET" | "POST" | "PUT";
  headers: Record<string, string>;
  body?: URLSearchParams | string;
  timeoutMs: number;
  retries: number;
}

function shouldRetry(status?: number): boolean {
  if (status === undefined) {
    return true;
  }

  return status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function requestJson<T>(options: RequestOptions): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= options.retries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
      const response = await fetch(options.url, {
        method: options.method,
        headers: options.headers,
        body: options.body ? (typeof options.body === "string" ? options.body : options.body.toString()) : undefined,
        signal: controller.signal,
      });

      const text = await response.text();
      const payload = text ? (JSON.parse(text) as unknown) : null;

      if (!response.ok) {
        throw new OsmApiError(
          `OSM API request failed (${response.status}): ${text.slice(0, 300)}`,
          response.status,
        );
      }

      return payload as T;
    } catch (error) {
      lastError = error;
      const statusCode = error instanceof OsmApiError ? error.statusCode : undefined;
      const retry = attempt < options.retries && shouldRetry(statusCode);

      if (!retry) {
        break;
      }

      const backoff = 300 * 2 ** attempt;
      await sleep(backoff);
      attempt += 1;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("Unknown HTTP error while calling OSM API");
}
