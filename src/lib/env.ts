const requiredKeys = [
  "OSM_USERNAME",
  "OSM_PASSWORD",
  "OSM_CLIENT_ID",
  "OSM_CLIENT_SECRET",
  "OSM_APP_VERSION",
  "OSM_PLATFORM_ID_TOKEN",
  "OSM_PLATFORM_ID_VIDEO",
  "OSM_ORIGIN",
  "OSM_REFERER",
  "OSM_ACCEPT_LANGUAGE",
  "OSM_USER_AGENT",
  "OSM_LEAGUE_ID",
  "OSM_TEAM_ID",
  "CRON_SECRET",
] as const;

export interface EnvConfig {
  osmUsername: string;
  osmPassword: string;
  osmClientId: string;
  osmClientSecret: string;
  osmAppVersion: string;
  osmPlatformIdToken: string;
  osmPlatformIdVideo: string;
  osmOrigin: string;
  osmReferer: string;
  osmAcceptLanguage: string;
  osmUserAgent: string;
  osmCookie?: string;
  osmPriority?: string;
  osmLeagueId: number;
  osmTeamId: number;
  cronSecret: string;
  watchedRewardVariationMax: number;
  watchedCapVariationMax: number;
  requestTimeoutMs: number;
  requestRetries: number;
  osmTrainingTimerGameSettingId: number;
}

function parseNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric env var: ${name}`);
  }

  return parsed;
}

export function getEnvConfig(): EnvConfig {
  const missing: string[] = [];

  for (const key of requiredKeys) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  return {
    osmUsername: process.env.OSM_USERNAME as string,
    osmPassword: process.env.OSM_PASSWORD as string,
    osmClientId: process.env.OSM_CLIENT_ID as string,
    osmClientSecret: process.env.OSM_CLIENT_SECRET as string,
    osmAppVersion: process.env.OSM_APP_VERSION as string,
    osmPlatformIdToken: process.env.OSM_PLATFORM_ID_TOKEN as string,
    osmPlatformIdVideo: process.env.OSM_PLATFORM_ID_VIDEO as string,
    osmOrigin: process.env.OSM_ORIGIN as string,
    osmReferer: process.env.OSM_REFERER as string,
    osmAcceptLanguage: process.env.OSM_ACCEPT_LANGUAGE as string,
    osmUserAgent: process.env.OSM_USER_AGENT as string,
    osmCookie: process.env.OSM_COOKIE,
    osmPriority: process.env.OSM_PRIORITY,
    osmLeagueId: parseInt(process.env.OSM_LEAGUE_ID as string, 10),
    osmTeamId: parseInt(process.env.OSM_TEAM_ID as string, 10),
    cronSecret: process.env.CRON_SECRET as string,
    watchedRewardVariationMax: parseNumber("OSM_REWARD_VARIATION_MAX", 1),
    watchedCapVariationMax: parseNumber("OSM_CAP_VARIATION_MAX", 60),
    requestTimeoutMs: parseNumber("OSM_REQUEST_TIMEOUT_MS", 15000),
    requestRetries: parseNumber("OSM_REQUEST_RETRIES", 2),
    osmTrainingTimerGameSettingId: parseNumber("OSM_TRAINING_TIMER_GAME_SETTING_ID", 20),
  };
}

export function isKVConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}
