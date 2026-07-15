/**
 * AI provider contract — see docs/AI-PROVIDERS.md.
 *
 * Framework-free. Two responsibilities:
 *  - moderate(): judge one ambiguous chat message (returns a strict verdict)
 *  - interpretCommand(): parse a plain-English AI Assistant command into an intent
 */
import type { Category, CommandIntent } from '@ozenmod/shared';

export type ProviderId = 'pollinations' | 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'custom';

/** A verdict about a single message. */
export interface AIVerdict {
  action: 'allow' | 'delete' | 'warn' | 'timeout' | 'ban' | 'review';
  category: Category;
  severity: 0 | 1 | 2 | 3;
  confidence: number;
  reason: string;
}

export interface ContextMessage {
  role: 'viewer' | 'target' | 'bot';
  text: string;
}

export interface ModerationRequest {
  channelRules: string;
  context: ContextMessage[];
  message: { userDisplay: string; text: string };
  userState: { strikes: number; maxStrikes: number; firstTimeChatter: boolean };
}

export interface CommandRequest {
  raw: string;
  knownUsers: string[];
  context: { maxStrikes: number; categories: string[] };
}

export interface CallOptions {
  /** Hard timeout in milliseconds. */
  timeoutMs: number;
  signal?: AbortSignal;
}

export interface ProviderHealth {
  healthy: boolean;
  latencyMs?: number;
  detail?: string;
}

export interface AIProvider {
  readonly id: ProviderId;
  readonly label: string;
  readonly requiresApiKey: boolean;
  readonly defaultModel: string;

  /** Judge one message. Must resolve within opts.timeoutMs. */
  moderate(request: ModerationRequest, opts: CallOptions): Promise<AIVerdict>;

  /** Parse a plain-English moderation command into a structured intent. */
  interpretCommand(request: CommandRequest, opts: CallOptions): Promise<CommandIntent>;

  /** Cheap probe used by the UI "Test connection" and the circuit breaker. */
  testConnection(opts: CallOptions): Promise<ProviderHealth>;

  /** Optional dynamic model listing (Ollama, custom OpenAI-compatible). */
  listModels?(opts: CallOptions): Promise<string[]>;
}

/** Non-secret provider configuration (stored in RTDB; keys stay in the keychain). */
export interface AIConfig {
  provider: ProviderId;
  model?: string;
  baseUrl?: string;
  maxCallsPerMinute: number;
  fallback: 'conservative-local' | 'strict-local';
}

/** Reads API keys from a secure store (OS keychain in the desktop app). */
export interface SecretStore {
  getApiKey(provider: ProviderId): Promise<string | undefined>;
}
