/**
 * AI provider metadata — the single source the dashboard and the desktop app
 * render provider cards from. Adding a provider here (plus its implementation
 * in packages/ai, milestone M6) is all a contributor needs to do for it to
 * appear everywhere. See docs/AI-PROVIDERS.md.
 */

export type ProviderId = 'pollinations' | 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'custom';

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  subtitle: string;
  description: string;
  requiresApiKey: boolean;
  defaultModel: string;
  /** Short chip shown on the card footer. */
  keyHint: string;
  /** The free-tier default provider. */
  isDefault: boolean;
  /** Runs on the streamer's machine (no cloud call). */
  isLocal: boolean;
}

export const PROVIDERS: readonly ProviderMeta[] = [
  {
    id: 'pollinations',
    label: 'Pollinations',
    subtitle: 'Free tier default',
    description: 'Anonymous free AI — no account, no API key, no cost. Ideal for getting started.',
    requiresApiKey: false,
    defaultModel: 'openai (default)',
    keyHint: 'No key needed',
    isDefault: true,
    isLocal: false,
  },
  {
    id: 'openai',
    label: 'OpenAI',
    subtitle: 'gpt-4o-mini',
    description: 'Use your own OpenAI API key for stronger reasoning on ambiguous messages.',
    requiresApiKey: true,
    defaultModel: 'gpt-4o-mini',
    keyHint: 'API key required',
    isDefault: false,
    isLocal: false,
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    subtitle: 'claude-haiku-4-5',
    description: 'Claude models via your Anthropic key — fast verdicts with strong nuance.',
    requiresApiKey: true,
    defaultModel: 'claude-haiku-4-5',
    keyHint: 'API key required',
    isDefault: false,
    isLocal: false,
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    subtitle: 'gemini-2.0-flash',
    description: "Gemini's free API tier works well for moderate chat volumes.",
    requiresApiKey: true,
    defaultModel: 'gemini-2.0-flash',
    keyHint: 'API key required',
    isDefault: false,
    isLocal: false,
  },
  {
    id: 'ollama',
    label: 'Ollama',
    subtitle: 'Local · offline',
    description: 'Run models on your own machine. Fully private — chat never leaves your PC.',
    requiresApiKey: false,
    defaultModel: 'auto-detected',
    keyHint: 'No key needed',
    isDefault: false,
    isLocal: true,
  },
  {
    id: 'custom',
    label: 'Custom endpoint',
    subtitle: 'OpenAI-compatible',
    description: 'Point OZENMod at any OpenAI-compatible URL — LM Studio, vLLM, your proxy.',
    requiresApiKey: false,
    defaultModel: 'configurable',
    keyHint: 'Base URL + optional key',
    isDefault: false,
    isLocal: false,
  },
] as const;
