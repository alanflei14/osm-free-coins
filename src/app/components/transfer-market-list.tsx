"use client";

import { useMemo, useState } from "react";

import type { OSMTransferPlayerListingView } from "@/lib/types";

interface TransferMarketListProps {
  listings: OSMTransferPlayerListingView[];
}

type SortKey =
  | "price-desc"
  | "price-asc"
  | "ovr-desc"
  | "ovr-asc"
  | "age-asc"
  | "age-desc"
  | "progress-desc"
  | "progress-asc"
  | "team-asc"
  | "owner-asc";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-ES").format(value);
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

export function TransferMarketList({ listings }: TransferMarketListProps) {
  const [searchText, setSearchText] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("price-desc");

  const sortedListings = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    const filtered = listings.filter((listing) => {
      const ownerName = listing.ownerName ?? (listing.team.userId > 0 ? `Usuario #${listing.team.userId}` : "Libre");
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [listing.player.fullName, listing.player.name, listing.team.name, ownerName]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesPosition = positionFilter === "all" || String(listing.player.position) === positionFilter;
      const matchesOwner =
        ownerFilter === "all" ||
        (ownerFilter === "owned" && listing.team.userId > 0) ||
        (ownerFilter === "free" && listing.team.userId === 0);

      return matchesSearch && matchesPosition && matchesOwner;
    });

    return filtered.sort((a, b) => {
      const ownerA = a.ownerName ?? (a.team.userId > 0 ? `Usuario #${a.team.userId}` : "Libre");
      const ownerB = b.ownerName ?? (b.team.userId > 0 ? `Usuario #${b.team.userId}` : "Libre");

      switch (sortKey) {
        case "price-asc":
          return a.price - b.price || b.player.statOvr - a.player.statOvr;
        case "price-desc":
          return b.price - a.price || b.player.statOvr - a.player.statOvr;
        case "ovr-asc":
          return a.player.statOvr - b.player.statOvr || b.price - a.price;
        case "ovr-desc":
          return b.player.statOvr - a.player.statOvr || b.price - a.price;
        case "age-asc":
          return a.player.age - b.player.age || b.player.statOvr - a.player.statOvr;
        case "age-desc":
          return b.player.age - a.player.age || b.player.statOvr - a.player.statOvr;
        case "progress-asc":
          return a.player.trainingProgress - b.player.trainingProgress || b.price - a.price;
        case "progress-desc":
          return b.player.trainingProgress - a.player.trainingProgress || b.price - a.price;
        case "team-asc":
          return a.team.name.localeCompare(b.team.name) || b.price - a.price;
        case "owner-asc":
          return ownerA.localeCompare(ownerB) || a.team.name.localeCompare(b.team.name);
        default:
          return 0;
      }
    });
  }, [listings, ownerFilter, positionFilter, searchText, sortKey]);

  const ownerStats = useMemo(() => {
    return {
      owned: listings.filter((listing) => listing.team.userId > 0).length,
      free: listings.filter((listing) => listing.team.userId === 0).length,
    };
  }, [listings]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-sky-700">En lista</p>
          <p className="text-2xl font-semibold text-sky-950">{listings.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Precio medio</p>
          <p className="text-2xl font-semibold text-emerald-950">
            {listings.length > 0
              ? formatCurrency(Math.round(listings.reduce((acc, item) => acc + item.price, 0) / listings.length))
              : 0}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-amber-700">Más caro</p>
          <p className="text-2xl font-semibold text-amber-950">
            {listings.length > 0 ? formatCurrency(sortedListings[0].price) : 0}
          </p>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <label className="space-y-1 text-xs text-slate-600 md:col-span-2">
          <span className="font-semibold text-slate-900">Buscar</span>
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Jugador, club o dueño"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500"
          />
        </label>

        <label className="space-y-1 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">Posición</span>
          <select
            value={positionFilter}
            onChange={(event) => setPositionFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500"
          >
            <option value="all">Todas</option>
            <option value="1">Delantero</option>
            <option value="2">Centrocampista</option>
            <option value="3">Defensa</option>
            <option value="4">Portero</option>
          </select>
        </label>

        <label className="space-y-1 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">Dueño</span>
          <select
            value={ownerFilter}
            onChange={(event) => setOwnerFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500"
          >
            <option value="all">Todos</option>
            <option value="owned">Con usuario</option>
            <option value="free">Libres</option>
          </select>
        </label>

        <label className="space-y-1 text-xs text-slate-600 md:col-span-4">
          <span className="font-semibold text-slate-900">Ordenar</span>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500"
          >
            <option value="price-desc">Precio más alto</option>
            <option value="price-asc">Precio más bajo</option>
            <option value="ovr-desc">OVR más alto</option>
            <option value="ovr-asc">OVR más bajo</option>
            <option value="age-asc">Más joven primero</option>
            <option value="age-desc">Más veterano primero</option>
            <option value="progress-desc">Mayor progreso primero</option>
            <option value="progress-asc">Menor progreso primero</option>
            <option value="team-asc">Club A-Z</option>
            <option value="owner-asc">Dueño A-Z</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Con usuario: {ownerStats.owned}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Libres: {ownerStats.free}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
          Filtrados: {sortedListings.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-200">
            <tr>
              <th className="px-4 py-3">Jugador</th>
              <th className="px-4 py-3">Equipo</th>
              <th className="px-4 py-3">Dueño</th>
              <th className="px-4 py-3">Posición</th>
              <th className="px-4 py-3">OVR</th>
              <th className="px-4 py-3">DEF</th>
              <th className="px-4 py-3">ATT</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Edad</th>
              <th className="px-4 py-3">Progreso</th>
            </tr>
          </thead>
          <tbody>
            {sortedListings.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  No hay transferencias que coincidan con los filtros.
                </td>
              </tr>
            )}
            {sortedListings.map((listing) => {
              const ownerLabel =
                listing.ownerName ?? (listing.team.userId > 0 ? `Usuario #${listing.team.userId}` : "Libre");

              return (
                <tr key={listing.id} className="border-t border-slate-100 odd:bg-slate-50/70 even:bg-white">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{listing.player.fullName}</div>
                    <div className="text-xs text-slate-500">#{listing.player.squadNumber} · {listing.player.name}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="font-medium text-slate-900">{listing.team.name}</div>
                    <div className="text-xs text-slate-500">Ranking {listing.team.ranking} · {listing.team.city}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {ownerLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{getPositionName(listing.player.position)}</td>
                  <td className="px-4 py-3 text-slate-900 font-semibold">{listing.player.statOvr}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{listing.player.statDef}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{listing.player.statAtt}</td>
                  <td className="px-4 py-3 text-slate-900 font-semibold">{formatCurrency(listing.price)}</td>
                  <td className="px-4 py-3 text-slate-700">{listing.player.age}</td>
                  <td className="px-4 py-3 text-slate-700">{listing.player.trainingProgress}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
