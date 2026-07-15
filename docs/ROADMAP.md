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
Website development              🔨 IN PROGRESS  ← we are here (M1)
        ↓
Desktop app development          ⏳ next
        ↓
Twitch connection                ⏳ queued
        ↓
Firebase Realtime Database       ⏳ queued
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

### M1 — Website _(in progress)_

Monorepo bootstrap (workspaces, TS strict, ESLint/Prettier, CI), `packages/ui`
tokens from the validated design, marketing pages, download page, auth flow
scaffolding (Twitch → Vercel route → Firebase custom token; wired live in M4),
dashboard with demo data, AI Assistant panel UI.

### M2 — Desktop app shell

Electron + Vite + React scaffold, hardened window, onboarding wizard with Twitch
device flow, Control Room UI bound to a stubbed runtime, settings storage,
tray, update check.

### M3 — Twitch connection

`packages/twitch`: IRC client, Helix client (delete/timeout/ban/warn), EventSub
WebSocket, token refresh; live feed shows real chat with allow-only decisions.

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
