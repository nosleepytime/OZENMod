/**
 * Firebase Realtime Database schema (docs/DATABASE.md). Two data classes:
 * PERMANENT (channels/{uid}) and TEMPORARY per-session (sessions/{uid}), the
 * latter deleted automatically at stream end.
 */
import type { Sensitivity } from '@ozenmod/shared';

// ---------- Permanent: channels/{uid} ----------

export interface ChannelProfile {
  twitchUserId: string;
  login: string;
  displayName: string;
  avatarUrl: string;
  connectedAt: number;
}

export type LinkPolicy = 'block-all' | 'trusted' | 'allow';
export type WarningMode = 'warn-then-sanction' | 'escalating-timeouts';

export interface WarningLadderStep {
  action: 'warn' | 'timeout';
  seconds?: number;
}

export interface ChannelConfig {
  configVersion: number;
  updatedAt: number;
  general: {
    botAccount: string | null;
    autoStartOnLive: boolean;
  };
  moderation: {
    sensitivity: Sensitivity;
    categories: Record<string, { detect: boolean; aiAssist: boolean; threshold: number }>;
    exemptions: { moderators: boolean; vips: boolean; subscribers: boolean; regulars: boolean };
    cooldownSeconds: number;
    firstTimeChatterBoost: boolean;
  };
  warnings: {
    mode: WarningMode;
    maxStrikes: number;
    ladder: WarningLadderStep[];
    finalAction: { action: 'timeout' | 'ban'; seconds?: number };
    reset: 'per-stream' | 'per-day';
  };
  filters: {
    bannedTerms: { term: string; severity: 'low' | 'high' }[];
    linkPolicy: LinkPolicy;
    trustedDomains: string[];
    spam: {
      capsPct: number;
      emoteMax: number;
      repeatWindow: number;
      ratePerWindow: number;
      windowSeconds: number;
    };
  };
  ai: {
    provider: string;
    model?: string;
    maxCallsPerMinute: number;
    fallback: 'conservative-local' | 'strict-local';
    // NOTE: never API keys — those stay in the OS keychain.
  };
  privacy: { storeSnippets: boolean };
}

export interface LifetimeStats {
  messagesAnalyzed: number;
  actionsTaken: number;
  aiCalls: number;
  sessions: number;
  firstSessionAt: number;
}

export interface SessionSummary {
  startedAt: number;
  endedAt: number;
  counters: SessionCounters;
}

export interface ChannelNode {
  profile: ChannelProfile;
  config: ChannelConfig;
  stats: { lifetime: LifetimeStats };
  lastSession: SessionSummary | null;
}

// ---------- Temporary: sessions/{uid} ----------

export interface SessionStatus {
  online: boolean;
  startedAt: number;
  lastHeartbeat: number;
  botVersion: string;
  runtime: 'desktop' | 'hosted';
  aiProviderHealthy: boolean;
}

export interface SessionCounters {
  messages: number;
  deleted: number;
  timeouts: number;
  bans: number;
  warningsIssued: number;
  aiCalls: number;
  reviewed: number;
}

export interface WarningRecord {
  count: number;
  lastAt: number;
  lastCategory: string;
}

export interface ReviewEntry {
  t: number;
  user: string;
  snippet?: string;
  category: string;
  confidence: number;
  suggested: string;
}

export interface RecentEvent {
  t: number;
  user: string;
  action: string;
  category: string;
  reason: string;
  source: 'local' | 'ai' | 'manual';
  strike?: string;
}

export type CommandStatus =
  'pending' | 'needs-confirmation' | 'confirmed' | 'done' | 'failed' | 'cancelled';

export interface CommandEntry {
  t: number;
  source: 'dashboard';
  raw: string;
  status: CommandStatus;
  intent?: unknown;
  result?: { appliedAt: number; message: string };
}

export interface SessionNode {
  status: SessionStatus;
  counters: SessionCounters;
  warnings: Record<string, WarningRecord>;
  review: Record<string, ReviewEntry>;
  recent: Record<string, RecentEvent>;
  commands: Record<string, CommandEntry>;
}

export const EMPTY_COUNTERS: SessionCounters = {
  messages: 0,
  deleted: 0,
  timeouts: 0,
  bans: 0,
  warningsIssued: 0,
  aiCalls: 0,
  reviewed: 0,
};
