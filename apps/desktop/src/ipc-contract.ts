/**
 * The typed contract between the sandboxed renderer and the main process.
 * Types only — erased at build time — so it can be imported by both sides.
 * The preload bridge exposes exactly these methods on window.ozenmod.
 */
import type { CommandIntent, ModerationEvent, ReviewItem } from '@ozenmod/shared';

export type BotState = 'idle' | 'starting' | 'protecting' | 'stopping' | 'error';

export interface ConnectionHealth {
  twitch: boolean;
  ai: boolean;
  eventSub: boolean;
  aiLatencyMs?: number;
  aiProvider: string;
}

export interface SessionStats {
  messages: number;
  actions: number;
  aiCalls: number;
  reviewPending: number;
}

export interface BotStatus {
  state: BotState;
  channel: string;
  botAccount: string | null;
  sessionStartedAt: number | null;
  health: ConnectionHealth;
  stats: SessionStats;
  appVersion: string;
}

export interface SystemInfo {
  appVersion: string;
  cpuPercent: number;
  memoryMb: number;
  chatLatencyMs: number;
  aiLatencyMs: number;
  lastSyncAt: number | null;
  updateAvailable: boolean;
}

export type LogLevel = 'info' | 'action' | 'ai' | 'warn' | 'error';

export interface LogEntry {
  at: number;
  level: LogLevel;
  message: string;
}

/** Device-code flow state surfaced to the onboarding UI. */
export interface DeviceCodeState {
  userCode: string;
  verificationUri: string;
  expiresInSeconds: number;
  status: 'waiting' | 'authorized' | 'expired' | 'error';
}

/** The result of executing an AI Assistant command. */
export interface CommandResult {
  intent: CommandIntent;
  status: 'done' | 'needs-confirmation' | 'cancelled' | 'failed';
  message: string;
}

/** Everything the preload bridge exposes on window.ozenmod. */
export interface OzenmodApi {
  getStatus(): Promise<BotStatus>;
  startBot(): Promise<BotStatus>;
  stopBot(): Promise<BotStatus>;
  getSystemInfo(): Promise<SystemInfo>;
  getFeed(): Promise<ModerationEvent[]>;
  getReviewQueue(): Promise<ReviewItem[]>;
  getLogs(): Promise<LogEntry[]>;

  /** Onboarding: begin Twitch device-code auth. */
  beginTwitchAuth(): Promise<DeviceCodeState>;

  /** AI Assistant: parse + (unless confirmation is required) execute a command. */
  runCommand(raw: string): Promise<CommandResult>;
  confirmCommand(intent: CommandIntent): Promise<CommandResult>;

  /** Subscriptions — return an unsubscribe function. */
  onStatus(cb: (status: BotStatus) => void): () => void;
  onFeed(cb: (event: ModerationEvent) => void): () => void;
  onLog(cb: (entry: LogEntry) => void): () => void;
}

declare global {
  interface Window {
    ozenmod: OzenmodApi;
  }
}
