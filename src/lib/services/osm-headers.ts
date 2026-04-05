import type { EnvConfig } from "@/lib/env";

export function buildCommonHeaders(
  env: EnvConfig,
  platformId: string,
  authorization?: string,
): Record<string, string> {
  const headers: Record<string, string> = {
    accept: "application/json; charset=utf-8",
    "accept-language": env.osmAcceptLanguage,
    appversion: env.osmAppVersion,
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    origin: env.osmOrigin,
    platformid: platformId,
    referer: env.osmReferer,
    "user-agent": env.osmUserAgent,
  };

  if (authorization) {
    headers.authorization = authorization;
  }

  if (env.osmCookie) {
    headers.cookie = env.osmCookie;
  }

  if (env.osmPriority) {
    headers.priority = env.osmPriority;
  }

  return headers;
}
