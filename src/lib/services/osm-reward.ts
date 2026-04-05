import { getEnvConfig } from "@/lib/env";
import { requestJson } from "@/lib/http";
import type { OSMConsumeRewardResponse } from "@/lib/types";

import { buildCommonHeaders } from "./osm-headers";

const CONSUME_URL = "https://web-api.onlinesoccermanager.com/api/v1/user/bosscoinwallet/consumereward";

export async function consumeReward(accessToken: string, rewardId: string): Promise<OSMConsumeRewardResponse> {
  const env = getEnvConfig();
  const body = new URLSearchParams({ rewardId });

  return requestJson<OSMConsumeRewardResponse>({
    url: CONSUME_URL,
    method: "POST",
    headers: buildCommonHeaders(env, env.osmPlatformIdVideo, `Bearer ${accessToken}`),
    body,
    timeoutMs: env.requestTimeoutMs,
    retries: env.requestRetries,
  });
}
