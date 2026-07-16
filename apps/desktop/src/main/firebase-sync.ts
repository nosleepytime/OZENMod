/**
 * FirebaseSync — pushes the desktop bot's live session data to Firebase so the
 * web dashboard updates in real time, and pulls the channel config so dashboard
 * edits take effect on the bot. It uses the desktop→web token exchange and the
 * RTDB REST client from @ozenmod/database (REST, not a socket — the bot never
 * consumes a realtime connection).
 *
 * Sync is entirely optional: when the web URL or the stored Twitch token is
 * absent it is a no-op and the bot still moderates locally.
 */
import {
  RestClient,
  SessionWriter,
  IdentityToolkit,
  TokenManager,
  exchangeDesktopToken,
  paths,
  type ChannelConfig,
  type RecentEvent,
  type ReviewEntry,
  type SessionCounters,
  type SessionStatus,
} from '@ozenmod/database';
import { loadTokens } from './token-vault';

const HEARTBEAT_MS = 30_000;
const CONFIG_POLL_MS = 5_000;
const COUNTER_FLUSH_MS = 5_000;

export interface SyncHandlers {
  onLog: (level: 'info' | 'warn' | 'error', message: string) => void;
  onConfig: (config: ChannelConfig) => void;
}

export interface FirebaseSync {
  /** Connect and write the initial status. Returns false if sync is disabled. */
  begin(botVersion: string): Promise<boolean>;
  event(entry: RecentEvent): void;
  review(entry: ReviewEntry): void;
  setCounters(counters: SessionCounters): void;
  finalize(startedAt: number, counters: SessionCounters): Promise<void>;
  stop(): void;
}

function resolveWebUrl(): string | null {
  return process.env.OZENMOD_WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? null;
}

const NULL_SYNC: FirebaseSync = {
  begin: async () => false,
  event: () => {},
  review: () => {},
  setCounters: () => {},
  finalize: async () => {},
  stop: () => {},
};

export function createFirebaseSync(handlers: SyncHandlers): FirebaseSync {
  const webUrl = resolveWebUrl();
  const tokens = loadTokens();
  if (!webUrl || !tokens) return NULL_SYNC;

  let writer: SessionWriter | null = null;
  let uid = '';
  let etag: string | null = null;
  let latestCounters: SessionCounters | null = null;
  const timers: ReturnType<typeof setInterval>[] = [];

  const logErr = (e: unknown) =>
    handlers.onLog('warn', `Live sync write failed: ${e instanceof Error ? e.message : String(e)}`);

  function clearTimers(): void {
    for (const t of timers) clearInterval(t);
    timers.length = 0;
  }

  async function begin(botVersion: string): Promise<boolean> {
    try {
      const auth = await exchangeDesktopToken({
        webUrl: webUrl!,
        accessToken: tokens!.accessToken,
      });
      const kit = new IdentityToolkit({ apiKey: auth.apiKey });
      const manager = new TokenManager(kit);
      await manager.start(auth.customToken);
      uid = `twitch:${auth.profile.twitchUserId}`;

      const rest = new RestClient({
        databaseUrl: auth.databaseURL,
        getIdToken: () => manager.getIdToken(),
      });
      writer = new SessionWriter(rest, uid);

      const startedAt = Date.now();
      const status: SessionStatus = {
        online: true,
        startedAt,
        lastHeartbeat: startedAt,
        botVersion,
        runtime: 'desktop',
        aiProviderHealthy: true,
      };
      await writer.begin(status);

      const initial = await rest.get<ChannelConfig>(paths.config(uid));
      if (initial) handlers.onConfig(initial);

      timers.push(
        setInterval(() => {
          if (writer) void writer.heartbeat(Date.now()).catch(logErr);
        }, HEARTBEAT_MS),
      );
      timers.push(
        setInterval(() => {
          if (writer && latestCounters) void writer.counters(latestCounters).catch(logErr);
        }, COUNTER_FLUSH_MS),
      );
      timers.push(
        setInterval(() => {
          void rest
            .pollWithEtag<ChannelConfig>(paths.config(uid), etag)
            .then((r) => {
              etag = r.etag;
              if (!r.notModified && r.value) handlers.onConfig(r.value);
            })
            .catch(logErr);
        }, CONFIG_POLL_MS),
      );

      handlers.onLog('info', 'Live sync connected — your dashboard will update in real time.');
      return true;
    } catch (e) {
      handlers.onLog(
        'warn',
        `Live sync unavailable: ${e instanceof Error ? e.message : String(e)}`,
      );
      writer = null;
      return false;
    }
  }

  return {
    begin,
    event: (entry) => {
      if (writer) void writer.event(entry).catch(logErr);
    },
    review: (entry) => {
      if (writer) void writer.review(entry).catch(logErr);
    },
    setCounters: (counters) => {
      latestCounters = counters;
    },
    finalize: async (startedAt, counters) => {
      clearTimers();
      if (writer) {
        try {
          await writer.finalize(startedAt, counters);
        } catch (e) {
          logErr(e);
        }
      }
      writer = null;
    },
    stop: () => {
      clearTimers();
      writer = null;
    },
  };
}
