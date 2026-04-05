import { getEnvConfig } from "@/lib/env";
import { requestJson } from "@/lib/http";
import type { OSMReward, OSMVideoStartResponse } from "@/lib/types";

import { buildCommonHeaders } from "./osm-headers";

const START_URL = "https://web-api.onlinesoccermanager.com/api/v1.1/user/videos/start";
const WATCHED_URL = "https://web-api.onlinesoccermanager.com/api/v1.1/user/videos/watched";

export async function startVideosSession(accessToken: string, capVariation = 0): Promise<OSMVideoStartResponse> {
  const env = getEnvConfig();
  const body = new URLSearchParams({
    actionId: "Shop",
    capVariation: String(capVariation),
  });

  return requestJson<OSMVideoStartResponse>({
    url: START_URL,
    method: "POST",
    headers: buildCommonHeaders(env, env.osmPlatformIdVideo, `Bearer ${accessToken}`),
    body,
    timeoutMs: env.requestTimeoutMs,
    retries: env.requestRetries,
  });
}

export async function watchedVideos(
  accessToken: string,
  rewardVariation: number,
  capVariation: number,
): Promise<OSMReward[]> {
  const env = getEnvConfig();
  const body = new URLSearchParams({
    actionId: "Shop",
    rewardVariation: String(rewardVariation),
    capVariation: String(capVariation),
  });

  return requestJson<OSMReward[]>({
    url: WATCHED_URL,
    method: "POST",
    headers: buildCommonHeaders(env, env.osmPlatformIdVideo, `Bearer ${accessToken}`),
    body,
    timeoutMs: env.requestTimeoutMs,
    retries: env.requestRetries,
  });
}

/**
 * Inicia una sesión de video para entrenamientos
 */
export async function startTrainingVideoSession(
  accessToken: string,
  capVariation = 0,
): Promise<OSMVideoStartResponse> {
  const env = getEnvConfig();
  const body = new URLSearchParams({
    actionId: "TrainingTimer",
    capVariation: String(capVariation),
  });

  return requestJson<OSMVideoStartResponse>({
    url: START_URL,
    method: "POST",
    headers: buildCommonHeaders(env, env.osmPlatformIdVideo, `Bearer ${accessToken}`),
    body,
    timeoutMs: env.requestTimeoutMs,
    retries: env.requestRetries,
  });
}

/**
 * Marca un video de entrenamiento como visto
 */
export async function watchedTrainingVideo(
  accessToken: string,
  rewardVariation: number,
  capVariation: number,
): Promise<OSMReward[]> {
  const env = getEnvConfig();
  const body = new URLSearchParams({
    actionId: "TrainingTimer",
    rewardVariation: String(rewardVariation),
    capVariation: String(capVariation),
  });

  return requestJson<OSMReward[]>({
    url: WATCHED_URL,
    method: "POST",
    headers: buildCommonHeaders(env, env.osmPlatformIdVideo, `Bearer ${accessToken}`),
    body,
    timeoutMs: env.requestTimeoutMs,
    retries: env.requestRetries,
  });
}
