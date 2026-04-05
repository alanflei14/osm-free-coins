import { getEnvConfig } from "@/lib/env";
import { requestJson } from "@/lib/http";
import type { OSMTransferPlayerListing } from "@/lib/types";

import { buildCommonHeaders } from "./osm-headers";

const HEADER_PLATFORM_ID = "14";

export async function getTransferPlayers(
  accessToken: string,
  leagueId: number,
  teamId: number,
): Promise<OSMTransferPlayerListing[]> {
  const env = getEnvConfig();
  const url = `https://web-api.onlinesoccermanager.com/api/v1/leagues/${leagueId}/teams/${teamId}/transferplayers/0`;

  return requestJson<OSMTransferPlayerListing[]>({
    url,
    method: "GET",
    headers: buildCommonHeaders(env, HEADER_PLATFORM_ID, `Bearer ${accessToken}`),
    timeoutMs: env.requestTimeoutMs,
    retries: env.requestRetries,
  });
}
