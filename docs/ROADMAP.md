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
Twitch connection                ✅ done (M3 — packages/twitch)  ← we are here
        ↓
Firebase Realtime Database       🔨 next (M4)
        ↓
AI moderation system             ⏳ queued
        ↓
Full automation                  ⏳ queued
        ↓
Tests                            ⏳ queued
        ↓
Official release                 ⏳ queued
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

### M4 — Firebase integration

`packages/database`: schema types, REST writer, ETag config poller, session
lifecycle with automatic cleanup + crash sweep; dashboard reads real data;
security rules deployed and tested.

### M5 — Moderation engine

`packages/core`: S0–S4 stages with golden-corpus tests, decision engine, warning
ladder (both modes), severity bypass, review queue — shipping in "local-only" mode.

### M6 — AI system

`packages/ai`: provider registry, Pollinations default, BYO providers, budget,
cache, circuit breaker, fallback; ambiguity gate wired; explanations end-to-end;
AI Assistant command parsing (`interpretCommand`) + web command queue live.

### M7 — Automation & polish

Auto start/stop on stream events, notifications, stats aggregation, empty states,
error states, accessibility pass, performance pass against the targets in
[MODERATION.md §7](./MODERATION.md).

### M8 — Tests & release

Cross-package integration tests, evasion fuzzing, manual test matrix
(Windows/macOS), `release.yml` producing installers + checksums, docs site pages,
**v0.1.0** GitHub Release.

## Versioning

- SemVer, `v0.x` during pre-release; `CHANGELOG.md` (Keep a Changelog) updated
  every PR.
- Premium tier remains out of scope for all v0/v1 milestones — only the extension
  points listed in [ARCHITECTURE.md §9](./ARCHITECTURE.md) exist.
