export * from './schema';
export { paths } from './paths';
export { defaultConfig, CONFIG_VERSION } from './defaults';
export {
  finalizeSession,
  mergeLifetime,
  isStaleSession,
  reachedFinalAction,
  idsToTrim,
  STALE_HEARTBEAT_MS,
} from './session-lifecycle';
export { RestClient } from './rest-client';
export type { RestClientOptions, ConfigPollResult } from './rest-client';
