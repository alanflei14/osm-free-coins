import { getEnvConfig } from "@/lib/env";
import { requestJson } from "@/lib/http";
import type { OSMBossCoinWallet, OSMTeamBalanceAndSavings } from "@/lib/types";

import { buildCommonHeaders } from "./osm-headers";

const HEADER_PLATFORM_ID = "14";
const WALLET_URL = "https://web-api.onlinesoccermanager.com/api/v1/user/bosscoinwallet";

export async function getBossCoinWallet(accessToken: string): Promise<OSMBossCoinWallet> {
  const env = getEnvConfig();

  return requestJson<OSMBossCoinWallet>({
    url: WALLET_URL,
    method: "GET",
    headers: buildCommonHeaders(env, HEADER_PLATFORM_ID, `Bearer ${accessToken}`),
    timeoutMs: env.requestTimeoutMs,
    retries: env.requestRetries,
  });
}

export async function getTeamBalanceAndSavings(
  accessToken: string,
  leagueId: number,
  teamId: number,
): Promise<OSMTeamBalanceAndSavings> {
  const env = getEnvConfig();
  const url = `https://web-api.onlinesoccermanager.com/api/v1/leagues/${leagueId}/teams/${teamId}/finances/balanceandsavings`;

  return requestJson<OSMTeamBalanceAndSavings>({
    url,
    method: "GET",
    headers: buildCommonHeaders(env, HEADER_PLATFORM_ID, `Bearer ${accessToken}`),
    timeoutMs: env.requestTimeoutMs,
    retries: env.requestRetries,
  });
}
