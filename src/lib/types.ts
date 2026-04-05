export type RunStatus = "success" | "partial" | "error";

export interface OSMTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface OSMVideoStartResponse {
  actionId: string;
  isCapReached: boolean;
  isClaimable: boolean;
  timestampUntilUnreached: number;
}

export interface OSMReward {
  id: string;
  userId: number;
  creationTimestamp: number;
  expiredTimestamp: number;
  reward: {
    id: number;
    type: number;
    value: number;
    variation: number;
    inventoryLimit: number;
  };
  action: {
    id: string;
    type: number;
  };
}

export interface OSMConsumeRewardResponse {
  id: number;
  userId: number;
  amount: number;
  claimedAtTimestamp: number;
  unclaimedCoins?: number;
  nextClaimTimestamp?: number;
}

export interface OSMBossCoinWallet {
  id: number;
  userId: number;
  amount: number;
  claimedAtTimestamp: number;
  unclaimedCoins: number;
  nextClaimTimestamp: number;
  countdownTimer: OSMCountdownTimer | null;
}

export interface OSMTeamBalanceAndSavings {
  id: string;
  teamId: number;
  leagueId: number;
  fixedIncome: number;
  savings: number;
  balance: number;
}

export interface OSMTransferTeam {
  id: number;
  baseId: string;
  uniqueId: string;
  name: string;
  city: string;
  ranking: number;
  stadiumName: string;
  stadiumCapacity: number;
  stadiumLevel: number;
  previousRanking: number;
  rankingStatus: number;
  budget: number;
  userId: number;
  crewId: number;
  baseTeamId: number;
  isForeignTeam: boolean;
  poule: string;
}

export interface OSMTransferPlayerListing {
  id: number;
  player: OSMPlayer;
  boosted: number;
  leagueId: number;
  teamId: number;
  team: OSMTransferTeam;
  type: number;
  price: number;
  timeStampForSale: number;
  transferPrice: number;
  variableFee: number;
  leagueTypeId: number;
}

export interface OSMTransferPlayerListingView extends OSMTransferPlayerListing {
  ownerName?: string | null;
}

export interface RunError {
  step: string;
  message: string;
  statusCode?: number;
}

export interface OSMPlayerAsset {
  id: number;
  type: number;
  value: string;
  path: string;
}

export interface OSMNationality {
  id: number;
  code: string;
  name: string;
}

export interface OSMPlayer {
  id: number;
  assets: OSMPlayerAsset[];
  fullName: string;
  name: string;
  mainId: string;
  position: number;
  specificPosition: number;
  statAtt: number;
  statDef: number;
  statOvr: number;
  age: number;
  teamId: number;
  leagueId: number;
  fitness: number;
  morale: number;
  goals: number;
  status: number;
  unavailable: number;
  lineup: number;
  value: number;
  yellowCards: number;
  trainingProgress: number;
  injuryId: number;
  suspensionId: number;
  assists: number;
  lastPlayerGrade: number;
  averagePlayerGrade: number;
  lastAveragePlayerGrade: number;
  matchesPlayed: number;
  goalsLastMatch: number;
  rarity: number;
  source: number;
  nationality: OSMNationality;
  squadNumber: number;
  leagueTypeId: number;
  themeId: number;
}

export interface OSMCountdownTimer {
  id: number;
  teamId: number;
  leagueId: number;
  type: number;
  title: string;
  currentTimestamp: number;
  finishedTimestamp: number;
  isClaimed: boolean;
  isBoosted: boolean;
}

export interface OSMTrainingForecast {
  playerId: number;
  forecast: number;
  forecastUniversal: number;
}

export type OSMTrainerType = 1 | 2 | 3 | 4;

export interface OSMTrainingSession {
  id: number;
  leagueId: number;
  teamId: number;
  weekNr: number;
  playerId: number;
  player: OSMPlayer;
  trainer: OSMTrainerType;
  countdownTimerId: number;
  countdownTimer: OSMCountdownTimer | null;
  trainingForecast: OSMTrainingForecast;
  progressImprovement: number;
  statImprovement: number;
  isSuperTraining: boolean;
}

export interface OSMTrainingBoostResponse {
  trainingSession: OSMTrainingSession;
  progressImprovement: number;
  isSuperTraining: boolean;
  variableTrainingProgression: number;
}

export interface OSMTrainingMutationResult {
  sessions: OSMTrainingSession[];
  createdSessions: OSMTrainingSession[];
}

export interface StartCheckLog {
  actionId: string;
  isCapReached: boolean;
  isClaimable: boolean;
  timestampUntilUnreached: number;
}

export interface OSMExecutionRun {
  runId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: RunStatus;
  tokenOk: boolean;
  startCheck: StartCheckLog | null;
  watchedAttempts: number;
  rewardsReceived: number;
  rewardsConsumedOk: number;
  rewardsConsumedFailed: Array<{ rewardId: string; error: string }>;
  coinsClaimed: number;
  errors: RunError[];
  rawMeta: {
    rewardVariationMax: number;
    capVariationMax: number;
  };
}

export interface OSMOrchestrationResult {
  run: OSMExecutionRun;
}
