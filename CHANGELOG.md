# Changelog

All notable changes to OZENMod are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) ·
Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added

- **Twitch integration (milestone M3)** — `packages/twitch`, framework-free and
  fully unit-tested (35 cases): an IRCv3 tag/message parser and a WSS chat client
  (CAP/PASS/NICK/JOIN, PING→PONG, jittered-backoff reconnect, `say()` for public
  warnings); a Helix client for the moderation actions (delete message, timeout,
  ban, unban, native warning) plus user lookup and EventSub subscription, with a
  token-bucket rate limiter and one Retry-After-aware retry; an EventSub WebSocket
  client (welcome/keepalive/notification/reconnect) driving `stream.online` /
  `stream.offline`; the OAuth device-code flow with proactive, request-coalescing
  token refresh and validation; and a `TwitchChatSession` orchestrator. Wired into
  the desktop `BotRuntime` through a `LiveConnector` (real chat shown allow-only
  until the engine lands in M5) backed by a `safeStorage` token vault, with a demo
  fallback when no Twitch credentials are configured.
- **Desktop app (milestone M2)** — Electron + Vite + React (`apps/desktop`), built
  with electron-vite. Hardened window (contextIsolation, sandbox, `nodeIntegration`
  off) with a typed IPC allowlist as its only capability surface; onboarding wizard
  with the Twitch device-code step; Control Room (live status, feed, human-review
  queue, system panel) bound to a `BotRuntime` (local implementation on demo data);
  Logs console; Settings; system tray; application menu; and auto-updater config
  (GitHub Releases). The AI Assistant panel is built in, same behavior as the web.
- **`packages/ai`** — modular AI provider system: `AIProvider` interface, registry,
  Pollinations free-tier provider, strict verdict/command JSON validation, and the
  AI Assistant command parser (moved here so the website and desktop app share one
  implementation), covered by 13 Vitest cases.
- **Release pipeline** — `.github/workflows/release.yml` builds Windows (NSIS) and
  macOS (DMG/ZIP) installers on tag push, generates `SHA256SUMS`, and publishes a
  GitHub Release; electron-builder configuration for all three desktop targets.
- **AI Assistant command sidebar**: an "Ask AI" button on every dashboard page and
  in the desktop app opens a right-side panel where the streamer moderates in plain
  English — ban/unban, timeout/untimeout, warn/unwarn, clear strikes, delete/purge
  messages, rule changes, queries and undo, with or without a reason. Reversible
  actions execute instantly with an Undo; permanent bans and mass actions require
  confirmation. A deterministic slash-grammar parser works with zero AI.
- **Website implementation (milestone M1)**: monorepo bootstrap (npm workspaces,
  strict TypeScript, ESLint, Prettier, Vitest, GitHub Actions CI), `packages/shared`
  (domain types, constants, provider metadata) and `packages/ui` (design tokens).
  Next.js App Router site matching the validated mockups — landing, download, sign-in,
  privacy, terms, docs, 404/500 — and the full dashboard (overview, moderation, AI &
  providers, filters, settings) running on clearly-labeled demo data, with the AI
  Assistant wired in. Twitch OAuth and health API routes scaffolded (env-driven,
  degrade gracefully until Firebase lands in M4).
- Complete product & engineering design documentation (`docs/`): product design,
  architecture, Firebase Realtime Database schema with automatic session cleanup,
  local-first moderation pipeline, modular AI provider system, security model,
  roadmap.
- High-fidelity design mockups (`design/`): website (landing, sign-in, dashboard
  overview, moderation history, AI & providers, settings) and desktop app
  (onboarding, control room, logs, settings), with rendered screenshots.
- Open-source scaffolding: README, MIT license, contributing guide, issue and
  pull request templates.

> Design approved on 2026-07-15. Milestones M1 (website), M2 (desktop app) and
> M3 (Twitch integration) are implemented; next is Firebase (M4) — see
> [docs/ROADMAP.md](docs/ROADMAP.md).
