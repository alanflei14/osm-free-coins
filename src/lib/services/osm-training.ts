import { getEnvConfig } from "@/lib/env";
import { requestJson } from "@/lib/http";
import type {
  OSMPlayer,
  OSMTrainerType,
  OSMTrainingSession,
  OSMTrainingBoostResponse,
} from "@/lib/types";

import { buildCommonHeaders } from "./osm-headers";

const BASE_URL = "https://web-api.onlinesoccermanager.com/api/v1";
const BOOST_URL = "https://web-api.onlinesoccermanager.com/api/v1.1";
const TRAINERS: OSMTrainerType[] = [1, 2, 3, 4];

export async function getOngoingTrainingSessions(
  accessToken: string,
  leagueId: number,
  teamId: number,
): Promise<OSMTrainingSession[]> {
  const env = getEnvConfig();
  const url = `${BASE_URL}/leagues/${leagueId}/teams/${teamId}/trainingsessions/ongoing`;

  return requestJson<OSMTrainingSession[]>({
    url,
    method: "GET",
    headers: buildCommonHeaders(env, env.osmPlatformIdVideo, `Bearer ${accessToken}`),
    timeoutMs: env.requestTimeoutMs,
    retries: env.requestRetries,
  });
}

export async function boostTrainingSessionWithCoins(
  accessToken: string,
  leagueId: number,
  teamId: number,
  trainingSessionId: number,
  productId: number = 1000,
): Promise<OSMTrainingBoostResponse> {
  const env = getEnvConfig();
  const url = `${BOOST_URL}/leagues/${leagueId}/teams/${teamId}/trainingsessions/${trainingSessionId}/boost`;
  const body = new URLSearchParams({ productId: String(productId) });

  return requestJson<OSMTrainingBoostResponse>({
    url,
    method: "PUT",
    headers: buildCommonHeaders(env, env.osmPlatformIdVideo, `Bearer ${accessToken}`),
    body,
    timeoutMs: env.requestTimeoutMs,
    retries: env.requestRetries,
  });
}

/**
 * Consume una recompensa de video para una sesión de entrenamiento
 */
export async function consumeVideoRewardForTraining(
  accessToken: string,
  leagueId: number,
  teamId: number,
  trainingSessionId: number,
  rewardId: string,
): Promise<OSMTrainingSession> {
  const env = getEnvConfig();
  const url = `${BASE_URL}/leagues/${leagueId}/teams/${teamId}/trainingsessions/${trainingSessionId}/consumereward`;
  const body = new URLSearchParams({ rewardId });

  return requestJson<OSMTrainingSession>({
    url,
    method: "POST",
    headers: buildCommonHeaders(env, env.osmPlatformIdVideo, `Bearer ${accessToken}`),
    body,
    timeoutMs: env.requestTimeoutMs,
    retries: env.requestRetries,
  });
}

export async function claimTrainingSession(
  accessToken: string,
  leagueId: number,
  teamId: number,
  trainingSessionId: number,
): Promise<void> {
  const env = getEnvConfig();
  const url = `${BOOST_URL}/leagues/${leagueId}/teams/${teamId}/trainingsessions/${trainingSessionId}/claim`;

  await requestJson<void>({
    url,
    method: "PUT",
    headers: {
      ...buildCommonHeaders(env, env.osmPlatformIdVideo, `Bearer ${accessToken}`),
      "content-type": "application/json; charset=utf-8",
    },
    timeoutMs: env.requestTimeoutMs,
    retries: env.requestRetries,
  });
}

export async function getTeamPlayers(
  accessToken: string,
  leagueId: number,
  teamId: number,
): Promise<OSMPlayer[]> {
  const env = getEnvConfig();
  const url = `${BASE_URL}/leagues/${leagueId}/teams/${teamId}/players`;

  return requestJson<OSMPlayer[]>({
    url,
    method: "GET",
    headers: {
      ...buildCommonHeaders(env, env.osmPlatformIdVideo, `Bearer ${accessToken}`),
      "content-type": "application/json; charset=utf-8",
    },
    timeoutMs: env.requestTimeoutMs,
    retries: env.requestRetries,
  });
}

export async function createTrainingSession(
  accessToken: string,
  leagueId: number,
  teamId: number,
  playerId: number,
  trainer: OSMTrainerType,
  timerGameSettingId = 9000,
): Promise<OSMTrainingSession> {
  const env = getEnvConfig();
  const url = `${BASE_URL}/leagues/${leagueId}/teams/${teamId}/trainingsessions`;
  const body = new URLSearchParams({
    playerId: String(playerId),
    trainer: String(trainer),
    timerGameSettingId: String(timerGameSettingId),
  });

  return requestJson<OSMTrainingSession>({
    url,
    method: "POST",
    headers: buildCommonHeaders(env, env.osmPlatformIdVideo, `Bearer ${accessToken}`),
    body,
    timeoutMs: env.requestTimeoutMs,
    retries: env.requestRetries,
  });
}

export async function fillTrainingGaps(
  accessToken: string,
  leagueId: number,
  teamId: number,
  timerGameSettingId = 20,
): Promise<OSMTrainingSession[]> {
  const [sessions, players] = await Promise.all([
    getOngoingTrainingSessions(accessToken, leagueId, teamId),
    getTeamPlayers(accessToken, leagueId, teamId),
  ]);

  const activeTrainers = new Set(
    sessions
      .filter((session) => TRAINERS.includes(session.trainer))
      .map((session) => session.trainer),
  );
  const trainingPlayerIds = new Set(sessions.map((session) => session.playerId));

  const createdSessions: OSMTrainingSession[] = [];

  for (const trainer of TRAINERS) {
    if (activeTrainers.has(trainer)) {
      continue;
    }

    const candidate = players
      .filter((player) => {
        return (
          player.position === trainer &&
          !trainingPlayerIds.has(player.id) &&
          player.unavailable === 0 &&
          player.injuryId === 0 &&
          player.suspensionId === 0 &&
          player.status === 0
        );
      })
      .sort((a, b) => b.trainingProgress - a.trainingProgress || b.statOvr - a.statOvr)[0];

    if (!candidate) {
      continue;
    }

    const createdSession = await createTrainingSession(
      accessToken,
      leagueId,
      teamId,
      candidate.id,
      trainer,
      timerGameSettingId,
    );
    trainingPlayerIds.add(candidate.id);
    createdSessions.push(createdSession);
  }

  return createdSessions;
}
