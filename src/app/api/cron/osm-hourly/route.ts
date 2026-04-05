import { NextRequest, NextResponse } from "next/server";

import { getEnvConfig } from "@/lib/env";
import { saveRun } from "@/lib/repositories/run-logger";
import { executeHourlyOsmFlow } from "@/lib/services/osm-orchestrator";

function isAuthorized(request: NextRequest, cronSecret: string): boolean {
  const authHeader = request.headers.get("authorization");
  const xCronSecret = request.headers.get("x-cron-secret");
  const querySecret = request.nextUrl.searchParams.get("secret");

  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  if (xCronSecret === cronSecret) {
    return true;
  }

  if (querySecret === cronSecret) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const env = getEnvConfig();

    if (!isAuthorized(request, env.cronSecret)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await executeHourlyOsmFlow();
    await saveRun(result.run);

    return NextResponse.json({
      ok: true,
      runId: result.run.runId,
      status: result.run.status,
      rewardsReceived: result.run.rewardsReceived,
      rewardsConsumedOk: result.run.rewardsConsumedOk,
      rewardsConsumedFailed: result.run.rewardsConsumedFailed.length,
      durationMs: result.run.durationMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown cron error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
