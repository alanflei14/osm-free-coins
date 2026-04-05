import { getEnvConfig } from "@/lib/env";
import { requestJson } from "@/lib/http";
import type { OSMTokenResponse } from "@/lib/types";

import { buildCommonHeaders } from "./osm-headers";

const TOKEN_URL = "https://web-api.onlinesoccermanager.com/api/token";

export async function fetchOsmToken(): Promise<OSMTokenResponse> {
  const env = getEnvConfig();
  const body = new URLSearchParams({
    userName: env.osmUsername,
    grant_type: "password",
    client_id: env.osmClientId,
    client_secret: env.osmClientSecret,
    password: env.osmPassword,
  });

  return requestJson<OSMTokenResponse>({
    url: TOKEN_URL,
    method: "POST",
    headers: buildCommonHeaders(env, env.osmPlatformIdToken),
    body,
    timeoutMs: env.requestTimeoutMs,
    retries: env.requestRetries,
  });
}
