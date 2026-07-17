export * from './types';
export * from './registry';
export * from './verdict-schema';
export { parseCommand, actionMeta } from './command-parser';
export type { ActionIcon, ActionTone } from './command-parser';
export { createPollinationsProvider, pollinationsChat } from './providers/pollinations';

// Web search (Keenable) for the AI Assistant.
export { createKeenableSearch } from './search/keenable';
export type { WebSearch, SearchQuery, SearchResult, SearchOptions } from './search/keenable';
export { SEARCH_TOOL_INSTRUCTIONS } from './search/instructions';
export { runResearch, parsePlan } from './search/research';
export type {
  ChatFn,
  ResearchRequest,
  ResearchResult,
  ResearchSource,
  ResearchDeps,
  ResearchOptions,
} from './search/research';
