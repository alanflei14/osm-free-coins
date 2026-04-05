"use client";

import { useState } from "react";
import { TrainingSessionsList } from "./training-sessions-list";
import { TransferMarketList } from "./transfer-market-list";
import type {
  OSMExecutionRun,
  OSMPlayer,
  OSMTrainerType,
  OSMTrainingMutationResult,
  OSMTrainingSession,
  OSMTransferPlayerListing,
} from "@/lib/types";

interface HomeTabsProps {
  runManualExecution: () => Promise<void>;
  handleBoostTraining: (sessionId: number) => Promise<OSMTrainingSession[]>;
  handleBoostVideoTraining: (sessionId: number) => Promise<OSMTrainingSession[]>;
  handleClaimTraining: (sessionId: number) => Promise<OSMTrainingSession[]>;
  handleFillTrainingGaps: () => Promise<OSMTrainingMutationResult>;
  handleCreateTraining: (playerId: number, trainer: OSMTrainerType) => Promise<OSMTrainingMutationResult>;
  latest: OSMExecutionRun | null;
  rewardsToday: number;
  avgDuration: number;
  runs: OSMExecutionRun[];
  trainingSessions: OSMTrainingSession[];
  teamPlayers: OSMPlayer[];
  transferPlayers: OSMTransferPlayerListing[];
  trainingError: string | null;
}

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

function getPositionName(position: number): string {
  const positions: Record<number, string> = {
    1: "Delantero",
    2: "Centrocampista",
    3: "Defensa",
    4: "Portero",
  };

  return positions[position] ?? "Desconocido";
}

function TeamRosterList({
  players,
  trainingSessions,
}: {
  players: OSMPlayer[];
  trainingSessions: OSMTrainingSession[];
}) {
  const trainingPlayerIds = new Set(trainingSessions.map((session) => session.playerId));
  const sortedPlayers = [...players].sort(
    (a, b) => a.position - b.position || b.statOvr - a.statOvr || a.squadNumber - b.squadNumber,
  );

  return (
    <div
      className="space-y-4 rounded-2xl border border-amber-200/60 p-4 shadow-sm"
      style={{ background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)" }}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-sky-700">Total</p>
          <p className="text-2xl font-semibold text-slate-900">{players.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-emerald-700">En entrenamiento</p>
          <p className="text-2xl font-semibold text-emerald-950">{trainingPlayerIds.size}</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-violet-700">Disponibles</p>
          <p className="text-2xl font-semibold text-violet-950">
            {players.length - trainingPlayerIds.size}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-amber-700">Promedio OVR</p>
          <p className="text-2xl font-semibold text-amber-950">
            {players.length > 0
              ? Math.round(players.reduce((acc, player) => acc + player.statOvr, 0) / players.length)
              : 0}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-200">
            <tr>
              <th className="px-4 py-3">Jugador</th>
              <th className="px-4 py-3">Posición</th>
              <th className="px-4 py-3">OVR</th>
              <th className="px-4 py-3">Fitness</th>
              <th className="px-4 py-3">Morale</th>
              <th className="px-4 py-3">Progreso</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => {
              const isTraining = trainingPlayerIds.has(player.id);

              return (
                <tr key={player.id} className="border-t border-slate-100 odd:bg-slate-50/70 even:bg-white">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{player.fullName}</div>
                    <div className="text-xs text-slate-500">
                      #{player.squadNumber} · {player.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{getPositionName(player.position)}</td>
                  <td className="px-4 py-3 text-slate-900 font-semibold">{player.statOvr}</td>
                  <td className="px-4 py-3 text-slate-700">{player.fitness}%</td>
                  <td className="px-4 py-3 text-slate-700">{player.morale}%</td>
                  <td className="px-4 py-3 text-slate-700">{player.trainingProgress}%</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        isTraining ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isTraining ? "Entrenando" : "Disponible"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function HomeTabs({
  runManualExecution,
  handleBoostTraining,
  handleBoostVideoTraining,
  handleClaimTraining,
  handleFillTrainingGaps,
  handleCreateTraining,
  latest,
  rewardsToday,
  avgDuration,
  runs,
  trainingSessions,
  teamPlayers,
  transferPlayers,
  trainingError,
}: HomeTabsProps) {
  const [activeTab, setActiveTab] = useState<"monitoring" | "training" | "plantilla" | "transferencias">("monitoring");

  return (
    <>
      {/* Tab Navigation */}
      <nav className="flex gap-2 mb-6 border-b border-slate-700">
        <button
          onClick={() => setActiveTab("monitoring")}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === "monitoring"
              ? "text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Monitoreo
        </button>
        <button
          onClick={() => setActiveTab("training")}
          className={`px-4 py-2 font-semibold transition relative ${
            activeTab === "training"
              ? "text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Entrenadores
          {trainingSessions.length > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {trainingSessions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("plantilla")}
          className={`px-4 py-2 font-semibold transition relative ${
            activeTab === "plantilla"
              ? "text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Plantilla
        </button>
        <button
          onClick={() => setActiveTab("transferencias")}
          className={`px-4 py-2 font-semibold transition relative ${
            activeTab === "transferencias"
              ? "text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Transferencias
          {transferPlayers.length > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-cyan-600 rounded-full">
              {transferPlayers.length}
            </span>
          )}
        </button>
      </nav>

      {/* Monitoring Tab */}
      {activeTab === "monitoring" && (
        <>
          <section className="hero">
            <p className="label text-slate-200!">Monitoreo OSM</p>
            <h1>Ejecuciones del cron horario para videos y créditos de recompensa</h1>
            <p className="mt-2 text-sm text-teal-100">
              Historial real persistido en servidor con detalle por corrida, errores y recompensas
              consumidas.
            </p>
            <form action={runManualExecution} className="mt-4">
              <button
                type="submit"
                className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-200"
              >
                Ejecutar ahora
              </button>
            </form>
          </section>

          <section className="meta-grid">
            <article className="card">
              <p className="label">Ultima ejecucion</p>
              <p className="value">{latest ? formatDate(latest.startedAt) : "Sin datos"}</p>
              {latest && <p className={statusClass(latest.status)}>{latest.status}</p>}
            </article>
            <article className="card">
              <p className="label">Rewards procesados hoy (UTC)</p>
              <p className="value">{rewardsToday}</p>
              <p className="text-sm text-slate-500">
                Conteo acumulado de rewards consumidos con exito
              </p>
            </article>
            <article className="card">
              <p className="label">Duracion promedio</p>
              <p className="value">{avgDuration} ms</p>
              <p className="text-sm text-slate-500">
                Calculado sobre las ultimas {runs.length} ejecuciones
              </p>
            </article>
          </section>

          <section className="card">
            <h2 className="text-xl font-semibold">Ejecuciones recientes</h2>
            <div className="mt-3">
              <table className="runs-table">
                <thead>
                  <tr>
                    <th>Inicio</th>
                    <th>Estado</th>
                    <th>Duracion</th>
                    <th>Rewards</th>
                    <th>Coins</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-sm text-slate-500">
                        Aun no hay ejecuciones. Dispara manualmente el endpoint cron para registrar
                        la primera corrida.
                      </td>
                    </tr>
                  )}
                  {runs.map((run) => (
                    <tr key={run.runId}>
                      <td>
                        <div>{formatDate(run.startedAt)}</div>
                        <div className="mono">{run.runId}</div>
                      </td>
                      <td>
                        <span className={statusClass(run.status)}>{run.status}</span>
                      </td>
                      <td>{run.durationMs} ms</td>
                      <td>
                        <div>{run.rewardsConsumedOk} ok</div>
                        <div className="text-sm text-slate-500">
                          {run.rewardsConsumedFailed.length} fallidos
                        </div>
                      </td>
                      <td>{run.coinsClaimed}</td>
                      <td>
                        <details>
                          <summary className="cursor-pointer text-sm font-semibold text-teal-900">
                            Ver
                          </summary>
                          <div className="mt-2 text-sm text-slate-700">
                            <p>watchedAttempts: {run.watchedAttempts}</p>
                            <p>rewardsReceived: {run.rewardsReceived}</p>
                            <p>tokenOk: {String(run.tokenOk)}</p>
                            <p>
                              startCheck:{" "}
                              {run.startCheck ? JSON.stringify(run.startCheck) : "null"}
                            </p>
                            {run.errors.length > 0 && (
                              <ul className="error-list">
                                {run.errors.map((error, index) => (
                                  <li key={`${run.runId}-error-${index}`}>
                                    [{error.step}] {error.message}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Training Tab */}
      {activeTab === "training" && (
        <section className="card">
          <h2 className="text-xl font-semibold mb-4">Jugadores en Entrenamiento</h2>
          {trainingError && (
            <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded text-red-100">
              <p className="font-semibold">Error cargando entrenamientos</p>
              <p className="text-sm">{trainingError}</p>
            </div>
          )}
          <TrainingSessionsList
            initialSessions={trainingSessions}
            onBoost={handleBoostTraining}
            onBoostVideo={handleBoostVideoTraining}
            onClaim={handleClaimTraining}
            onFillGaps={handleFillTrainingGaps}
            onCreateTraining={handleCreateTraining}
            availablePlayers={teamPlayers}
            isLoading={false}
          />
        </section>
      )}

      {activeTab === "plantilla" && (
        <section className="card border border-slate-200 bg-white/90">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Plantilla completa</h2>
          <TeamRosterList players={teamPlayers} trainingSessions={trainingSessions} />
        </section>
      )}

      {activeTab === "transferencias" && (
        <section className="card border border-slate-200 bg-white/90">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Lista de transferencias</h2>
          <TransferMarketList listings={transferPlayers} />
        </section>
      )}
    </>
  );
}
