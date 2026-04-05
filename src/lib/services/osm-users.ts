import { getEnvConfig } from "@/lib/env";
import { requestJson } from "@/lib/http";

import { buildCommonHeaders } from "./osm-headers";

const HEADER_PLATFORM_ID = "14";

export interface OSMUserProfile {
  id: number;
  userName?: string;
  displayName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

export async function getUserProfile(
  accessToken: string,
  userId: number,
): Promise<OSMUserProfile | null> {
  const env = getEnvConfig();
  const endpoints = [
    `https://web-api.onlinesoccermanager.com/api/v1/users/${userId}`,
    `https://web-api.onlinesoccermanager.com/api/v1/users/${userId}/profile`,
    `https://web-api.onlinesoccermanager.com/api/v1/user/${userId}`,
  ];

  for (const url of endpoints) {
    try {
      return await requestJson<OSMUserProfile>({
        url,
        method: "GET",
        headers: buildCommonHeaders(env, HEADER_PLATFORM_ID, `Bearer ${accessToken}`),
        timeoutMs: env.requestTimeoutMs,
        retries: 0,
      });
    } catch {
      // Intenta el siguiente endpoint si este no existe o no responde con perfil.
    }
  }

  return null;
}

export async function getUserDisplayName(accessToken: string, userId: number): Promise<string | null> {
  const profile = await getUserProfile(accessToken, userId);
  if (!profile) {
    return null;
  }

  return profile.displayName ?? profile.userName ?? profile.name ?? null;
}
