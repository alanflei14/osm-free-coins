import { NextResponse } from "next/server";

import { getEnvConfig, isKVConfigured } from "@/lib/env";

export async function GET(): Promise<NextResponse> {
  let envReady = true;
  let envError = "";

  try {
    getEnvConfig();
  } catch (error) {
    envReady = false;
    envError = error instanceof Error ? error.message : "Unknown env validation error";
  }

  return NextResponse.json({
    ok: envReady,
    timestamp: new Date().toISOString(),
    envReady,
    envError,
    kvConfigured: isKVConfigured(),
  });
}
