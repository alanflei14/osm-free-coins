"use client";

import { useState } from "react";
import { TrainingPlayerCard } from "./training-player-card";
import type {
  OSMPlayer,
  OSMTrainerType,
  OSMTrainingMutationResult,
  OSMTrainingSession,
} from "@/lib/types";

interface TrainingSessionsListProps {
  initialSessions: OSMTrainingSession[];
  availablePlayers: OSMPlayer[];
  onBoost: (sessionId: number) => Promise<OSMTrainingSession[]>;
  onBoostVideo: (sessionId: number) => Promise<OSMTrainingSession[]>;
  onClaim: (sessionId: number) => Promise<OSMTrainingSession[]>;
  onFillGaps: () => Promise<OSMTrainingMutationResult>;
  onCreateTraining: (playerId: number, trainer: OSMTrainerType) => Promise<OSMTrainingMutationResult>;
  isLoading?: boolean;
}

const TRAINER_OPTIONS: Array<{ value: OSMTrainerType; label: string }> = [
  { value: 1, label: "Delantero (Ofensivo)" },
  { value: 2, label: "Mediocampo" },
  { value: 3, label: "Defensa" },
  { value: 4, label: "Arquero" },
];

export function TrainingSessionsList({
  initialSessions,
  availablePlayers,
  onBoost,
  onBoostVideo,
  onClaim,
  onFillGaps,
  onCreateTraining,
  isLoading = false,
}: TrainingSessionsListProps) {
  const [sessions, setSessions] = useState<OSMTrainingSession[]>(initialSessions);
  const [localLoading, setLocalLoading] = useState(false);
  const [fillError, setFillError] = useState<string | null>(null);
  const [lastCreatedSessions, setLastCreatedSessions] = useState<OSMTrainingSession[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<OSMTrainerType>(1);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const handleBoost = async (sessionId: number): Promise<OSMTrainingSession[]> => {
    setLocalLoading(true);
    try {
      const updatedSessions = await onBoost(sessionId);
      setSessions(updatedSessions);
      return updatedSessions;
    } catch (error) {
      console.error("Error boosting training session:", error);
      throw error;
    } finally {
      setLocalLoading(false);
    }
  };

  const handleBoostVideo = async (sessionId: number): Promise<OSMTrainingSession[]> => {
    setLocalLoading(true);
    try {
      const updatedSessions = await onBoostVideo(sessionId);
      setSessions(updatedSessions);
      return updatedSessions;
    } catch (error) {
      console.error("Error boosting training with video:", error);
      throw error;
    } finally {
      setLocalLoading(false);
    }
  };

  const handleClaim = async (sessionId: number): Promise<OSMTrainingSession[]> => {
    setLocalLoading(true);
    try {
      const updatedSessions = await onClaim(sessionId);
      setSessions(updatedSessions);
      return updatedSessions;
    } catch (error) {
      console.error("Error claiming training session:", error);
      throw error;
    } finally {
      setLocalLoading(false);
    }
  };

  const handleFillGaps = async (): Promise<void> => {
    setLocalLoading(true);
    setFillError(null);
    try {
      const result = await onFillGaps();
      setSessions(result.sessions);
      setLastCreatedSessions(result.createdSessions);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setFillError(message);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCreateTraining = async (): Promise<void> => {
    if (selectedPlayerId === null) {
      setFillError("Selecciona un jugador para crear el entrenamiento");
      return;
    }

    setLocalLoading(true);
    setFillError(null);
    try {
      const result = await onCreateTraining(selectedPlayerId, selectedTrainer);
      setSessions(result.sessions);
      setLastCreatedSessions(result.createdSessions);
      setSelectedPlayerId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setFillError(message);
    } finally {
      setLocalLoading(false);
    }
  };

  const trainingPlayerIds = new Set(sessions.map((session) => session.playerId));
  const trainerIsOccupied = sessions.some((session) => session.trainer === selectedTrainer);
  const candidates = availablePlayers
    .filter((player) => {
      return (
        player.position === selectedTrainer &&
        !trainingPlayerIds.has(player.id) &&
        player.unavailable === 0 &&
        player.injuryId === 0 &&
        player.suspensionId === 0 &&
        player.status === 0
      );
    })
    .sort((a, b) => b.trainingProgress - a.trainingProgress || b.statOvr - a.statOvr);

  const selectedPlayer = candidates.find((player) => player.id === selectedPlayerId) ?? null;

  const manualFillPanel = (
    <div className="rounded-lg border border-cyan-500/70 bg-slate-950/85 p-4 space-y-3 shadow-lg shadow-cyan-950/20">
      <h3 className="text-sm font-semibold text-cyan-100">Rellenar hueco manual</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="text-xs text-slate-200 space-y-1">
          <span className="font-medium text-slate-100">Estilo</span>
          <select
            className="w-full rounded border border-cyan-400/60 bg-slate-900 px-2 py-2 text-sm text-slate-50 shadow-sm focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/30"
            value={selectedTrainer}
            onChange={(event) => {
              const nextTrainer = Number(event.target.value) as OSMTrainerType;
              setSelectedTrainer(nextTrainer);
              setSelectedPlayerId(null);
            }}
          >
            {TRAINER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-200 space-y-1 md:col-span-2">
          <span className="font-medium text-slate-100">Jugador</span>
          <select
            className="w-full rounded border border-cyan-400/60 bg-slate-900 px-2 py-2 text-sm text-slate-50 shadow-sm focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/30"
            value={selectedPlayerId ?? ""}
            onChange={(event) => {
              const raw = event.target.value;
              setSelectedPlayerId(raw ? Number(raw) : null);
            }}
          >
            <option value="">Selecciona un jugador...</option>
            {candidates.map((player) => (
              <option key={player.id} value={player.id}>
                {player.fullName} | OVR {player.statOvr} | Progreso {player.trainingProgress}%
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-cyan-100/90">
          {trainerIsOccupied
            ? "Este estilo ya tiene entrenamiento activo. Puedes crear otro si OSM lo permite."
            : "Este estilo tiene hueco libre."}
          {selectedPlayer && (
            <span> Jugador elegido: {selectedPlayer.name} (#{selectedPlayer.squadNumber})</span>
          )}
        </div>
        <button
          onClick={handleCreateTraining}
          disabled={selectedPlayerId === null}
          className="rounded bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-slate-950 font-semibold px-4 py-2 text-sm transition shadow-sm"
        >
          Crear entrenamiento
        </button>
      </div>
    </div>
  );

  const createdSessionsPanel =
    lastCreatedSessions.length > 0 ? (
      <div className="rounded-lg border border-emerald-400/70 bg-slate-950/85 p-4 space-y-3 shadow-lg shadow-emerald-950/20">
        <h3 className="text-sm font-semibold text-emerald-100">Subida estimada</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {lastCreatedSessions.map((session) => (
            <div key={session.id} className="rounded border border-emerald-500/40 bg-slate-900/80 p-3">
              <p className="font-semibold text-slate-50">{session.player.fullName}</p>
              <p className="text-xs text-emerald-100/80">
                {session.player.name} · {session.player.trainingProgress}% actual · +
                {session.trainingForecast.forecast}% estimado
              </p>
              <p className="text-xs text-slate-200 mt-1">
                OVR universal: +{session.trainingForecast.forecastUniversal}% · Progreso real: +
                {session.progressImprovement}% · Stat: +{session.statImprovement}%
              </p>
            </div>
          ))}
        </div>
      </div>
    ) : null;

  if (isLoading || localLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-400">Cargando entrenador...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="py-8 space-y-4">
        <p className="text-slate-500 text-center">No hay jugadores entrenando en este momento</p>
        {manualFillPanel}
        {createdSessionsPanel}
        <div className="text-center">
          <button
            onClick={handleFillGaps}
            className="rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 text-sm transition shadow-sm"
          >
            Autorrellenar huecos
          </button>
        </div>
        {fillError && <p className="text-sm text-red-300 text-center">{fillError}</p>}
      </div>
    );
  }

  const sortedSessions = [...sessions].sort(
    (a, b) => a.player.trainingProgress - b.player.trainingProgress,
  );

  return (
    <div className="space-y-4">
      {manualFillPanel}
      {createdSessionsPanel}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Sesiones activas: {sessions.length}</p>
        <button
          onClick={handleFillGaps}
          className="rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 text-sm transition shadow-sm"
        >
          Autorrellenar huecos
        </button>
      </div>
      {fillError && <p className="text-sm text-red-300">{fillError}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedSessions.map((session) => (
          <TrainingPlayerCard
            key={session.id}
            session={session}
            onBoost={handleBoost}
            onBoostVideo={handleBoostVideo}
            onClaim={handleClaim}
          />
        ))}
      </div>
    </div>
  );
}
