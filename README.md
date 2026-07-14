<div align="center">

# 🛡️ OZENMod

**AI-powered, context-aware moderation for Twitch — free to run, open source, explainable.**

[![Status](https://img.shields.io/badge/status-design%20phase-8B7CFF)](docs/ROADMAP.md)
[![License](https://img.shields.io/badge/license-MIT-34D399)](LICENSE)
[![Made for Twitch](https://img.shields.io/badge/made%20for-Twitch-9146FF)](https://www.twitch.tv)

</div>

---

> **Project status — Design phase.** The complete product design and the
> high-fidelity mockups are finished and **awaiting validation**. Development of
> the real system starts only after the design is approved at 100 %.
> See the [Roadmap](docs/ROADMAP.md).

## What is OZENMod?

OZENMod moderates a Twitch chat in real time — and actually *understands* it.
Instead of matching a blacklist, it normalizes evasion tricks, scores messages
with local heuristics in milliseconds, and escalates only genuinely ambiguous
messages to an AI that reasons about context, targets and intent. Every action
comes with a human-readable explanation.

- **Free tier, truly free** — the bot runs on the streamer's computer inside the
  official desktop app (Windows/macOS). Website + dashboard on Vercel, data on
  Firebase's free plan, AI via Pollinations' free tier. No subscription, ever.
- **Local-first** — ≥ 95 % of messages are decided locally in < 5 ms; the AI is
  called only when a message is ambiguous.
- **Explainable** — allow, delete, warn, timeout, ban or human-review: each
  decision is logged with the reason.
- **Session-clean** — warnings and moderation state are temporary by design and
  deleted automatically when the stream ends.
- **Modular AI** — Pollinations by default; plug OpenAI, Anthropic, Gemini,
  Ollama (local) or any custom endpoint with your own key.

## Design preview

High-fidelity mockups (dark theme, English UI) live in [`design/`](design/) with
rendered screenshots in [`design/screenshots/`](design/screenshots/):

| Website | Desktop app |
| --- | --- |
| Landing, Sign-in, Dashboard overview, Moderation history, AI & Providers, Settings | Onboarding (Twitch device code), Control Room, Logs, Settings |

## Documentation

The full product & engineering design is in [`docs/`](docs/):

| Doc | Contents |
| --- | --- |
| [PRODUCT.md](docs/PRODUCT.md) | Vision, tiers, every page & view, features, UX, user flows |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Topology, monorepo layout, Twitch integration, updates, CI/CD |
| [DATABASE.md](docs/DATABASE.md) | Firebase RTDB schema, session cleanup, read/write optimization |
| [MODERATION.md](docs/MODERATION.md) | Local-first pipeline, AI escalation, decisions, warning ladder |
| [AI-PROVIDERS.md](docs/AI-PROVIDERS.md) | Provider interface, Pollinations default, BYO keys |
| [SECURITY.md](docs/SECURITY.md) | OAuth, token storage, rules, hardening, privacy |
| [ROADMAP.md](docs/ROADMAP.md) | Mandatory development order & milestones |

## Planned stack (all free)

React · Next.js · TypeScript (strict) · Tailwind CSS · Electron ·
Firebase Realtime Database · Firebase Auth · Twitch OAuth / IRC / EventSub ·
Pollinations (default AI) · Vercel · GitHub Actions · ESLint · Prettier

## Contributing

The project is open source (MIT). During the design phase, feedback on the docs
and mockups is the most valuable contribution — see
[CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © OZENMod contributors
