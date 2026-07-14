# OZENMod Documentation

This folder contains the complete product and engineering design of OZENMod.
It is the single source of truth for **what** we are building and **how** we are building it.

> **Project status:** Phase 1 (design) is complete. Development starts only after the
> visual design has been fully validated. See [ROADMAP.md](./ROADMAP.md).

## Documents

| Document | What it covers |
| --- | --- |
| [PRODUCT.md](./PRODUCT.md) | Product vision, tiers, every page of the website, every view of the desktop app, the full feature list, UX principles and all user flows. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Global architecture, monorepo folder structure, runtime topology, Twitch integration (OAuth, IRC, EventSub), updates, CI/CD, and the premium-ready extension points. |
| [DATABASE.md](./DATABASE.md) | Firebase Realtime Database schema, session-based data lifecycle, automatic cleanup, and the read/write/storage optimization strategy. |
| [MODERATION.md](./MODERATION.md) | The moderation pipeline: local-first analysis, AI escalation, decision types, explanations, the warning ladder and human review. |
| [AI-PROVIDERS.md](./AI-PROVIDERS.md) | The modular AI provider system: interface, registry, Pollinations free default, BYO-key providers, prompting contract and reliability. |
| [SECURITY.md](./SECURITY.md) | Security model: OAuth, token storage, secrets, database rules, Electron hardening, privacy and release integrity. |
| [ROADMAP.md](./ROADMAP.md) | The mandatory development order, current status and milestones. |

## Design mockups

High-fidelity mockups of the website and the desktop application live in
[`../design/`](../design/). Rendered screenshots are in
[`../design/screenshots/`](../design/screenshots/).

## Conventions

- Everything user-facing — UI, docs, errors, e-mails, logs — is written in **English only**.
- The free tier must never depend on a paid service. Every technology choice documents its free plan.
- Documents use [Mermaid](https://mermaid.js.org/) diagrams, rendered natively by GitHub.
