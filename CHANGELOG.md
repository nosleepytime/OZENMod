# Changelog

All notable changes to OZENMod are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) ·
Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added

- **AI Assistant command sidebar**: an "Ask AI" button on every dashboard page (and
  in the desktop app design) opens a right-side panel where the streamer moderates
  in plain English — ban/unban, timeout/untimeout, warn/unwarn, clear strikes,
  delete/purge messages, rule changes, queries and undo, with or without a reason.
  Reversible actions execute instantly with an Undo; permanent bans and mass actions
  require confirmation. Includes a deterministic slash-grammar parser that works with
  zero AI, covered by unit tests.
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

> Design approved on 2026-07-15. M1 (website) is implemented; next is the desktop
> app shell (M2) — see [docs/ROADMAP.md](docs/ROADMAP.md).
