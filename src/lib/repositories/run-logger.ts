import { kv } from "@vercel/kv";

import type { OSMExecutionRun } from "@/lib/types";

const RUN_INDEX_KEY = "osm:runs:index";
const MAX_STORED_RUNS = 300;

const memoryStore: OSMExecutionRun[] = [];

function runKey(runId: string): string {
  return `osm:runs:${runId}`;
}

function kvEnabled(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function saveRun(run: OSMExecutionRun): Promise<void> {
  if (!kvEnabled()) {
    memoryStore.unshift(run);
    if (memoryStore.length > MAX_STORED_RUNS) {
      memoryStore.pop();
    }
    return;
  }

  await kv.set(runKey(run.runId), run);
  await kv.lpush(RUN_INDEX_KEY, run.runId);
  await kv.ltrim(RUN_INDEX_KEY, 0, MAX_STORED_RUNS - 1);
}

export async function listRuns(limit = 50): Promise<OSMExecutionRun[]> {
  if (!kvEnabled()) {
    return memoryStore.slice(0, limit);
  }

  const ids = await kv.lrange<string>(RUN_INDEX_KEY, 0, Math.max(0, limit - 1));
  if (!ids || ids.length === 0) {
    return [];
  }

  const records = await Promise.all(ids.map((id) => kv.get<OSMExecutionRun>(runKey(id))));
  return records.filter((run): run is OSMExecutionRun => Boolean(run));
}

export async function getLastRun(): Promise<OSMExecutionRun | null> {
  const runs = await listRuns(1);
  return runs[0] ?? null;
}
