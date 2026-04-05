import { revalidatePath } from "next/cache";

import { listRuns } from "@/lib/repositories/run-logger";
import { saveRun } from "@/lib/repositories/run-logger";
import { executeHourlyOsmFlow } from "@/lib/services/osm-orchestrator";
import { fetchOsmToken } from "@/lib/services/osm-auth";
import {
  getOngoingTrainingSessions,
  getTeamPlayers,
  boostTrainingSessionWithCoins,
  consumeVideoRewardForTraining,
  claimTrainingSession,
  createTrainingSession,
  fillTrainingGaps,
} from "@/lib/services/osm-training";
import { getTransferPlayers } from "@/lib/services/osm-transfer";
import { getUserDisplayName } from "@/lib/services/osm-users";
import { getBossCoinWallet, getTeamBalanceAndSavings } from "@/lib/services/osm-wallet";
import { startTrainingVideoSession, watchedTrainingVideo } from "@/lib/services/osm-video";
import { getEnvConfig } from "@/lib/env";
import type {
  OSMExecutionRun,
  OSMBossCoinWallet,
  OSMPlayer,
  OSMTrainerType,
  OSMTrainingMutationResult,
  OSMTrainingSession,
  OSMTeamBalanceAndSavings,
  OSMTransferPlayerListingView,
} from "@/lib/types";
import { HomeTabs } from "./components/home-tabs";

export const dynamic = "force-dynamic";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

function statusClass(status: OSMExecutionRun["status"]): string {
  if (status === "success") {
    return "status-pill status-success";
  }

  if (status === "partial") {
    return "status-pill status-partial";
  }

  return "status-pill status-error";
}

function startOfTodayUtc(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-ES").format(value);
}

function formatNextClaim(timestamp: number | null | undefined): string {
  if (!timestamp) {
    return "Sin hora";
  }

  const remaining = Math.max(0, timestamp * 1000 - Date.now());
  const totalMinutes = Math.floor(remaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export default async function Home() {
  async function runManualExecution(): Promise<void> {
    "use server";

    const result = await executeHourlyOsmFlow();
    await saveRun(result.run);
    revalidatePath("/");
  }

  async function handleBoostTraining(sessionId: number): Promise<OSMTrainingSession[]> {
    "use server";

    try {
      const token = await fetchOsmToken();
      const env = getEnvConfig();
      await boostTrainingSessionWithCoins(
        token.access_token,
        env.osmLeagueId,
        env.osmTeamId,
        sessionId,
      );
      // Fetch updated sessions
      const updatedSessions = await getOngoingTrainingSessions(
        token.access_token,
        env.osmLeagueId,
        env.osmTeamId,
      );
      return updatedSessions;
    } catch (error) {
      console.error("Error boosting training session:", error);
      throw error;
    }
  }

  async function handleBoostVideoTraining(sessionId: number): Promise<OSMTrainingSession[]> {
    "use server";

    try {
      const token = await fetchOsmToken();
      const env = getEnvConfig();

      // Step 1: Star video session
      const videoStart = await startTrainingVideoSession(token.access_token, 0);

      if (!videoStart.isClaimable) {
        throw new Error(
          videoStart.isCapReached 
            ? "Ya alcanzaste el límite de videos para esta acción"
            : "No puedes reclamar video ahora"
        );
      }

      // Step 2: Mark video as watched
      const rewards = await watchedTrainingVideo(token.access_token, 0, 0);

      if (rewards.length === 0) {
        throw new Error("No rewards received from video");
      }

      const rewardId = rewards[0].id;

      // Step 3: Consume reward for training session
      await consumeVideoRewardForTraining(
        token.access_token,
        env.osmLeagueId,
        env.osmTeamId,
        sessionId,
        rewardId,
      );

      // Fetch updated sessions
      const updatedSessions = await getOngoingTrainingSessions(
        token.access_token,
        env.osmLeagueId,
        env.osmTeamId,
      );
      return updatedSessions;
    } catch (error) {
      console.error("Error boosting training with video:", error);
      throw error;
    }
  }

  async function handleClaimTraining(sessionId: number): Promise<OSMTrainingSession[]> {
    "use server";

    try {
      const token = await fetchOsmToken();
      const env = getEnvConfig();

      await claimTrainingSession(
        token.access_token,
        env.osmLeagueId,
        env.osmTeamId,
        sessionId,
      );

      const updatedSessions = await getOngoingTrainingSessions(
        token.access_token,
        env.osmLeagueId,
        env.osmTeamId,
      );
      return updatedSessions;
    } catch (error) {
      console.error("Error claiming training session:", error);
      throw error;
    }
  }

  async function handleFillTrainingGaps(): Promise<OSMTrainingMutationResult> {
    "use server";

    try {
      const token = await fetchOsmToken();
      const env = getEnvConfig();

      const createdSessions = await fillTrainingGaps(
        token.access_token,
        env.osmLeagueId,
        env.osmTeamId,
        env.osmTrainingTimerGameSettingId,
      );

      const updatedSessions = await getOngoingTrainingSessions(
        token.access_token,
        env.osmLeagueId,
        env.osmTeamId,
      );
      return { sessions: updatedSessions, createdSessions };
    } catch (error) {
      console.error("Error filling training gaps:", error);
      throw error;
    }
  }

  async function handleCreateTraining(
    playerId: number,
    trainer: OSMTrainerType,
  ): Promise<OSMTrainingMutationResult> {
    "use server";

    try {
      const token = await fetchOsmToken();
      const env = getEnvConfig();

      const createdSession = await createTrainingSession(
        token.access_token,
        env.osmLeagueId,
        env.osmTeamId,
        playerId,
        trainer,
        env.osmTrainingTimerGameSettingId,
      );

      const updatedSessions = await getOngoingTrainingSessions(
        token.access_token,
        env.osmLeagueId,
        env.osmTeamId,
      );
      return { sessions: updatedSessions, createdSessions: [createdSession] };
    } catch (error) {
      console.error("Error creating training session:", error);
      throw error;
    }
  }

  let trainingSessions: OSMTrainingSession[] = [];
  let teamPlayers: OSMPlayer[] = [];
  let transferPlayers: OSMTransferPlayerListingView[] = [];
  let bossCoinWallet: OSMBossCoinWallet | null = null;
  let teamBalance: OSMTeamBalanceAndSavings | null = null;
  let trainingError: string | null = null;

  try {
    const token = await fetchOsmToken();
    const env = getEnvConfig();
    const [sessions, players, transfers, wallet, balance] = await Promise.all([
      getOngoingTrainingSessions(token.access_token, env.osmLeagueId, env.osmTeamId),
      getTeamPlayers(token.access_token, env.osmLeagueId, env.osmTeamId),
      getTransferPlayers(token.access_token, env.osmLeagueId, env.osmTeamId),
      getBossCoinWallet(token.access_token),
      getTeamBalanceAndSavings(token.access_token, env.osmLeagueId, env.osmTeamId),
    ]);
    const ownerIds = [...new Set(transfers.map((listing) => listing.team.userId).filter((id) => id > 0))];
    const ownerEntries = await Promise.all(
      ownerIds.map(async (userId) => {
        const ownerName = await getUserDisplayName(token.access_token, userId);
        return [userId, ownerName] as const;
      }),
    );

    trainingSessions = sessions;
    teamPlayers = players;
    transferPlayers = transfers.map((listing) => ({
      ...listing,
      ownerName: ownerEntries.find(([userId]) => userId === listing.team.userId)?.[1] ?? null,
    }));
    bossCoinWallet = wallet;
    teamBalance = balance;
  } catch (error) {
    trainingError = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error fetching training sessions:", error);
  }

  const runs = await listRuns(50);
  const latest = runs[0] ?? null;
  const todayStart = startOfTodayUtc();

  const rewardsToday = runs
    .filter((run) => new Date(run.startedAt).getTime() >= todayStart)
    .reduce((acc, run) => acc + run.rewardsConsumedOk, 0);

  const avgDuration =
    runs.length > 0
      ? Math.round(runs.reduce((acc, run) => acc + run.durationMs, 0) / runs.length)
      : 0;

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/75 backdrop-blur-xl">
        <div className="page-shell my-0 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">OSM Monitor</p>
              <h1 className="text-xl font-bold text-slate-900">Monedas y finanzas del equipo</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 md:min-w-0" style={{ width: 620 }}>
              <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-amber-700">Monedas de hora</p>
                <p className="text-2xl font-bold text-amber-950">
                  {bossCoinWallet ? formatCurrency(bossCoinWallet.amount) : "--"}
                </p>
                <p className="text-xs text-amber-800">
                  Próximo bono en {bossCoinWallet ? formatNextClaim(bossCoinWallet.nextClaimTimestamp) : "--"}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-emerald-700">Plata</p>
                <p className="text-2xl font-bold text-emerald-950">
                  {teamBalance ? formatCurrency(teamBalance.balance) : "--"}
                </p>
                <p className="text-xs text-emerald-800">
                  Ahorros: {teamBalance ? formatCurrency(teamBalance.savings) : "--"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Ingreso fijo</p>
                <p className="text-2xl font-bold text-slate-900">
                  {teamBalance ? formatCurrency(teamBalance.fixedIncome) : "--"}
                </p>
                <p className="text-xs text-slate-600">Por jornada</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="page-shell">
        <HomeTabs
          runManualExecution={runManualExecution}
          handleBoostTraining={handleBoostTraining}
          handleBoostVideoTraining={handleBoostVideoTraining}
          handleClaimTraining={handleClaimTraining}
          handleFillTrainingGaps={handleFillTrainingGaps}
          handleCreateTraining={handleCreateTraining}
          latest={latest}
          rewardsToday={rewardsToday}
          avgDuration={avgDuration}
          runs={runs}
          trainingSessions={trainingSessions}
          teamPlayers={teamPlayers}
          transferPlayers={transferPlayers}
          trainingError={trainingError}
        />
      </main>
    </>
  );
}
