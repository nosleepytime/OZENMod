# Changelog

All notable changes to OZENMod are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) ·
Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added

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

> Design approved on 2026-07-15. Milestones M1 (website) and M2 (desktop app) are
> implemented; next is the live Twitch connection (M3) — see
> [docs/ROADMAP.md](docs/ROADMAP.md).
