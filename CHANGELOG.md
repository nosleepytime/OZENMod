# Changelog

All notable changes to OZENMod are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) ·
Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- **AI Assistant command sidebar** (design + dashboard UI): an "Ask AI" button on
  every dashboard page and in the desktop app opens a right-side panel where the
  streamer moderates in plain English — ban/unban, timeout/untimeout, warn/unwarn,
  clear strikes, delete messages, rule changes, queries and undo — with tiered
  confirmation for permanent bans and a full audit trail.
- Website implementation (milestone M1, in progress): monorepo bootstrap
  (npm workspaces, strict TypeScript, ESLint, Prettier, CI), `packages/shared`
  and `packages/ui`, Next.js app with marketing pages and the dashboard running
  on clearly-labeled demo data.
- Complete product & engineering design documentation (`docs/`): product design,
  architecture, Firebase Realtime Database schema with automatic session cleanup,
  local-first moderation pipeline, modular AI provider system, security model,
  roadmap.
- High-fidelity design mockups (`design/`): website (landing, sign-in, dashboard
  overview, moderation history, AI & providers, settings) and desktop app
  (onboarding, control room, logs, settings), with rendered screenshots.
- Open-source scaffolding: README, MIT license, contributing guide, issue and
  pull request templates.

> Design is awaiting validation. Implementation milestones (M1+) start after
> approval — see [docs/ROADMAP.md](docs/ROADMAP.md).
