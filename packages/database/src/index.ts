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
export { IdentityToolkit, TokenManager } from './identity';
export type { IdSession, IdentityOptions } from './identity';
export { SessionWriter } from './session-writer';
export type { RtdbLike } from './session-writer';
export { exchangeDesktopToken } from './desktop-auth';
export type { DesktopAuth, DesktopProfile, ExchangeOptions } from './desktop-auth';
