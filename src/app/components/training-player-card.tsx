"use client";

import { useEffect, useState } from "react";
import type { OSMTrainingSession } from "@/lib/types";

interface TrainingPlayerCardProps {
  session: OSMTrainingSession;
  onBoost: (sessionId: number) => Promise<OSMTrainingSession[]>;
  onBoostVideo: (sessionId: number) => Promise<OSMTrainingSession[]>;
  onClaim: (sessionId: number) => Promise<OSMTrainingSession[]>;
}

function formatTimeRemaining(finishedTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = Math.max(0, finishedTimestamp - now);

  if (remaining === 0) {
    return "Completado";
  }

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function getTrainerName(trainerType: number): string {
  const trainers: Record<number, string> = {
    1: "Ofensivo",
    2: "Centrocampistas",
    3: "Defensivo",
    4: "Porteros",
  };
  return trainers[trainerType] || "Desconocido";
}

function getPositionName(position: number): string {
  const positions: Record<number, string> = {
    1: "Delantero",
    2: "Centrocampista",
    3: "Defensa",
    4: "Portero",
  };
  return positions[position] || "Desconocido";
}

function getPlayerImage(player: OSMTrainingSession["player"]): string | null {
  const normalAsset = player.assets.find((a) => a.type === 1);
  return normalAsset?.path ?? null;
}

export function TrainingPlayerCard({ session, onBoost, onBoostVideo, onClaim }: TrainingPlayerCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>(
    session.countdownTimer ? formatTimeRemaining(session.countdownTimer.finishedTimestamp) : "N/A",
  );

  useEffect(() => {
    if (!session.countdownTimer) {
      setTimeRemaining("N/A");
      return;
    }

    const updateTimer = () => {
      setTimeRemaining(formatTimeRemaining(session.countdownTimer!.finishedTimestamp));
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [session.countdownTimer]);

  const isReadyToClaim =
    session.countdownTimer !== null &&
    Math.floor(Date.now() / 1000) >= session.countdownTimer.finishedTimestamp;

  const handleBoost = async () => {
    setIsLoading(true);
    try {
      await onBoost(session.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBoostVideo = async () => {
    setIsVideoLoading(true);
    setVideoError(null);
    try {
      await onBoostVideo(session.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setVideoError(errorMessage);
    } finally {
      setIsVideoLoading(false);
    }
  };

  const handleClaim = async () => {
    setIsClaimLoading(true);
    setVideoError(null);
    try {
      await onClaim(session.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setVideoError(errorMessage);
    } finally {
      setIsClaimLoading(false);
    }
  };

  const playerImage = getPlayerImage(session.player);
  const progressPercentage = Math.max(0, Math.min(100, session.player.trainingProgress));

  return (
    <article className="training-card bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-slate-500 transition">
      <div className="flex flex-col h-full">
        {/* Player Header */}
        <div className="flex gap-4 p-4 border-b border-slate-700">
          {playerImage && (
            <div className="shrink-0">
              <img
                src={playerImage}
                alt={session.player.fullName}
                className="w-16 h-16 object-cover rounded"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-100 truncate">{session.player.fullName}</h3>
            <p className="text-sm text-slate-400">{session.player.name}</p>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="px-2 py-1 bg-slate-700 text-slate-200 rounded">
                {getPositionName(session.player.position)}
              </span>
              <span className="px-2 py-1 bg-slate-700 text-slate-200 rounded">
                #{session.player.squadNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Training Info */}
        <div className="flex-1 p-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-400">Progreso: {session.player.trainingProgress}%</span>
              <span className="text-sm font-semibold text-teal-400">{getTrainerName(session.trainer)}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-slate-700 p-2 rounded">
              <p className="text-slate-400 text-xs">Tiempo restante</p>
              <p className="font-semibold text-slate-100 mono">{timeRemaining}</p>
            </div>
            <div className="bg-slate-700 p-2 rounded">
              <p className="text-slate-400 text-xs">Predicción</p>
              <p className="font-semibold text-slate-100">
                +{session.trainingForecast.forecast}%
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            <p>Morale: {session.player.morale}% | Fitness: {session.player.fitness}%</p>
            <p>Overall: {session.player.statOvr} | Att: {session.player.statAtt} | Def: {session.player.statDef}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-700 flex flex-col gap-2">
          {videoError && (
            <div className="text-xs bg-red-900 text-red-100 p-2 rounded border border-red-700">
              {videoError}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleBoost}
              disabled={isLoading || isVideoLoading || isClaimLoading}
              className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 text-slate-900 font-semibold rounded text-sm transition"
            >
              {isLoading ? "Procesando..." : "💰 Boost"}
            </button>
            <button
              onClick={handleBoostVideo}
              disabled={isVideoLoading || isLoading || isClaimLoading}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded text-sm transition"
            >
              {isVideoLoading ? "Viendo..." : "🎥 Video"}
            </button>
            <button
              onClick={handleClaim}
              disabled={!isReadyToClaim || isClaimLoading || isLoading || isVideoLoading}
              className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-semibold rounded text-sm transition"
            >
              {isClaimLoading ? "Completando..." : "✅ Completar"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
