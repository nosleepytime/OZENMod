/**
 * Provider registry. Adding a provider = register a factory here; the app never
 * hard-codes provider classes. See docs/AI-PROVIDERS.md §8.
 */
import type { AIConfig, AIProvider, ProviderId, SecretStore } from './types';
import { createPollinationsProvider } from './providers/pollinations';

export type ProviderFactory = (cfg: AIConfig, secrets: SecretStore) => AIProvider;

const factories = new Map<ProviderId, ProviderFactory>();

export function registerProvider(id: ProviderId, factory: ProviderFactory): void {
  factories.set(id, factory);
}

export function createProvider(cfg: AIConfig, secrets: SecretStore): AIProvider {
  const factory = factories.get(cfg.provider);
  if (!factory) throw new Error(`Unknown AI provider: ${cfg.provider}`);
  return factory(cfg, secrets);
}

export function registeredProviders(): ProviderId[] {
  return [...factories.keys()];
}

// Built-in providers. Others (openai, anthropic, gemini, ollama, custom) share
// an OpenAI-compatible HTTP core and are registered in milestone M6.
registerProvider('pollinations', () => createPollinationsProvider());
