import { randomUUID } from "crypto";

import { getEnvConfig } from "@/lib/env";
import { OsmApiError } from "@/lib/http";
import type { OSMExecutionRun, OSMOrchestrationResult, RunStatus } from "@/lib/types";

import { fetchOsmToken } from "./osm-auth";
import { consumeReward } from "./osm-reward";
import { startVideosSession, watchedVideos } from "./osm-video";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function finalizeStatus(run: OSMExecutionRun): RunStatus {
  if (run.errors.length === 0) {
    return "success";
  }

  if (run.rewardsConsumedOk > 0 || run.rewardsReceived > 0) {
    return "partial";
  }

  return "error";
}

export async function executeHourlyOsmFlow(): Promise<OSMOrchestrationResult> {
  const env = getEnvConfig();
  const startedAtDate = new Date();
  const run: OSMExecutionRun = {
    runId: randomUUID(),
    startedAt: startedAtDate.toISOString(),
    finishedAt: "",
    durationMs: 0,
    status: "error",
    tokenOk: false,
    startCheck: null,
    watchedAttempts: 0,
    rewardsReceived: 0,
    rewardsConsumedOk: 0,
    rewardsConsumedFailed: [],
    coinsClaimed: 0,
    errors: [],
    rawMeta: {
      rewardVariationMax: env.watchedRewardVariationMax,
      capVariationMax: env.watchedCapVariationMax,
    },
  };

  try {
    const token = await fetchOsmToken();
    run.tokenOk = true;

    const startCheck = await startVideosSession(token.access_token, 0);
    run.startCheck = {
      actionId: startCheck.actionId,
      isCapReached: startCheck.isCapReached,
      isClaimable: startCheck.isClaimable,
      timestampUntilUnreached: startCheck.timestampUntilUnreached,
    };

    if (!startCheck.isClaimable || startCheck.isCapReached) {
      run.status = "success";
      return { run: completeRun(run, startedAtDate) };
    }

    for (let rewardVariation = 0; rewardVariation <= env.watchedRewardVariationMax; rewardVariation += 1) {
      for (let capVariation = 0; capVariation <= env.watchedCapVariationMax; capVariation += 1) {
        let rewards;
        run.watchedAttempts += 1;

        try {
          rewards = await watchedVideos(token.access_token, rewardVariation, capVariation);
        } catch (error) {
          run.errors.push({
            step: "watched",
            message: `rewardVariation=${rewardVariation}, capVariation=${capVariation}: ${toErrorMessage(error)}`,
            statusCode: error instanceof OsmApiError ? error.statusCode : undefined,
          });
          break;
        }

        if (!Array.isArray(rewards) || rewards.length === 0) {
          break;
        }

        run.rewardsReceived += rewards.length;

        for (const reward of rewards) {
          try {
            const consumed = await consumeReward(token.access_token, reward.id);
            run.rewardsConsumedOk += 1;
            run.coinsClaimed += consumed.amount ?? 0;
          } catch (error) {
            run.rewardsConsumedFailed.push({
              rewardId: reward.id,
              error: toErrorMessage(error),
            });
            run.errors.push({
              step: "consumeReward",
              message: `rewardId=${reward.id}: ${toErrorMessage(error)}`,
              statusCode: error instanceof OsmApiError ? error.statusCode : undefined,
            });
          }
        }
      }
    }
  } catch (error) {
    run.errors.push({
      step: "orchestrator",
      message: toErrorMessage(error),
      statusCode: error instanceof OsmApiError ? error.statusCode : undefined,
    });
  }

  run.status = finalizeStatus(run);
  return { run: completeRun(run, startedAtDate) };
}

function completeRun(run: OSMExecutionRun, startedAtDate: Date): OSMExecutionRun {
  const finishedAtDate = new Date();
  return {
    ...run,
    finishedAt: finishedAtDate.toISOString(),
    durationMs: finishedAtDate.getTime() - startedAtDate.getTime(),
    status: run.status === "error" ? finalizeStatus(run) : run.status,
  };
}
