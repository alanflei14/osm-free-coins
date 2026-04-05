"use client";

import type { OSMPlayer, OSMTrainingSession } from "@/lib/types";

interface TeamRosterListProps {
  players: OSMPlayer[];
  trainingSessions: OSMTrainingSession[];
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

export function TeamRosterList({ players, trainingSessions }: TeamRosterListProps) {
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
                    <div className="text-xs text-slate-500">#{player.squadNumber} · {player.name}</div>
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
