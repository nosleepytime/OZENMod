# OZENMod — Roadmap & Development Order

Development follows a **mandatory order**: full design first, then visual design
validation, and only after 100 % approval, the real system.

```
Complete product design          ✅ done (this docs/ folder)
        ↓
Website visual design            ✅ done (design/mockups/web + screenshots)
        ↓
Desktop app visual design        ✅ done (design/mockups/desktop + screenshots)
        ↓
Screenshots & validation         ✅ APPROVED at 100% (2026-07-15)
        ↓
Website development              ✅ done (M1 — apps/web)
        ↓
Desktop app development          ✅ done (M2 — apps/desktop)
        ↓
Twitch connection                ✅ done (M3 — packages/twitch)
        ↓
Firebase + real auth             ✅ done (M4 — packages/database, sign in/up)
        ↓
Moderation engine                ✅ done (M5 — packages/core, no demo)
        ↓
Live desktop ↔ web sync          ✅ done (M6 — session mirrored to Firebase)
        ↓
AI escalation (S5)               ✅ done (M7 — Pollinations on the band)
        ↓
Official release                 🔨 tooling ready — awaiting the v0.1.0 tag  ← we are here
```

## Milestones

### M0 — Design (current)

- [x] Product design: pages, features, UX, user flows ([PRODUCT.md](./PRODUCT.md))
- [x] Architecture, folder structure, free-tier topology ([ARCHITECTURE.md](./ARCHITECTURE.md))
- [x] Firebase schema + cleanup/optimization strategy ([DATABASE.md](./DATABASE.md))
- [x] Moderation pipeline & decision design ([MODERATION.md](./MODERATION.md))
- [x] AI provider system design ([AI-PROVIDERS.md](./AI-PROVIDERS.md))
- [x] Security model ([SECURITY.md](./SECURITY.md))
- [x] High-fidelity mockups: website (6 screens) + desktop app (4 screens)
- [x] Rendered screenshots for review (`design/screenshots/`)
- [x] AI Assistant command sidebar designed (docs + mockups) — requested addition
- [x] **Design validated at 100 %** (2026-07-15) ← gate passed

### M1 — Website ✅

Monorepo bootstrap (workspaces, TS strict, ESLint/Prettier, Vitest, CI),
`packages/shared` + `packages/ui`, marketing pages, download page, auth-flow
scaffolding (Twitch → Vercel route → Firebase custom token; wired live in M4),
dashboard with demo data, AI Assistant panel UI. **Done** — `apps/web`.

### M2 — Desktop app shell ✅

Electron + Vite + React (electron-vite), hardened window (contextIsolation,
sandbox, typed IPC allowlist), onboarding wizard with the Twitch device-code
step, Control Room bound to a `BotRuntime` (local implementation on demo data),
Logs, Settings, tray, menu, updater config, and the AI Assistant panel. The
command parser lives in **`packages/ai`** (shared with the website) with Vitest
coverage. **Done** — `apps/desktop`, `packages/ai`.

### M3 — Twitch connection ✅

`packages/twitch`: IRCv3 parser + WSS client (PING/PONG, jittered reconnect),
Helix client (delete / timeout / ban / unban / warn) with token-bucket rate
limiting and Retry-After backoff, EventSub WS client (welcome / keepalive /
notification / reconnect for stream.online/offline), OAuth device-code flow +
proactive token refresh + validation, and a `TwitchChatSession` orchestrator.
Wired into the desktop `BotRuntime` via a `LiveConnector` (real chat, allow-only
until the engine lands in M5) with a token vault (`safeStorage`) and a demo
fallback when unconfigured. **48 unit tests** across the AI + Twitch packages.
**Done** — `packages/twitch`.

### M4 — Firebase integration & real auth ✅

`packages/database`: schema types, REST client with ETag config polling, session
lifecycle with automatic cleanup. Real sign-in (Twitch Authorization Code →
Firebase custom token), auth-gated dashboard, and a config editor that persists
to RTDB — every page reads real data with real empty states (no demo). Security
rules (`database.rules.json`) scope each streamer to their own data; `SETUP.md`
documents the whole setup. **Done** — `packages/database`, `apps/web` auth.

### M5 — Moderation engine ✅

`packages/core`: S1 normalization (evasion folding), S2 deterministic rules, S3
heuristic scoring, S4 ambiguity gate, and the S6 decision engine (severity
bypass, warning ladder both modes, cooldowns, review). Explainable throughout,
28 unit tests. Wired into the desktop `BotRuntime`, which moderates real chat
end-to-end — the demo session is gone. **Done** — `packages/core`.

### M6 — Live desktop ↔ web sync ✅

The running desktop bot mirrors its session to Firebase (status, counters,
events, review, warnings) so the web dashboard updates live, and polls config so
dashboard edits reach the bot. Token exchange via `/api/auth/desktop` +
`IdentityToolkit`/`TokenManager` + `SessionWriter`, all tested. **Done**.

### M7 — AI escalation & automation ✅

`packages/ai` provider registry + Pollinations default wired into the engine's
ambiguity gate (S5): the desktop `AiEscalator` judges band messages with the AI
budget, soft timeout, circuit breaker and local fallback. Auto start/stop on
stream events via EventSub. AI Assistant command parsing shared web + desktop.
**Done.** Remaining polish (BYO-provider keys for auto-escalation, web command
queue, stats aggregation, a11y/perf passes) tracked for follow-ups.

### M8 — Release 🔨

`release.yml` builds Windows + macOS installers on a `v*` tag and publishes a
review-first draft release; the desktop build bakes in the distribution config
from repository secrets ([RELEASING.md](../RELEASING.md)). Awaiting the
`TWITCH_CLIENT_ID` secret and the **v0.1.0** tag to cut the first release.

## Versioning

- SemVer, `v0.x` during pre-release; `CHANGELOG.md` (Keep a Changelog) updated
  every PR.
- Premium tier remains out of scope for all v0/v1 milestones — only the extension
  points listed in [ARCHITECTURE.md §9](./ARCHITECTURE.md) exist.
