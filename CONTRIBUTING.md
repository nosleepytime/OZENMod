# Contributing to OZENMod

Thanks for your interest! OZENMod is an open-source, free-first project and every
kind of contribution is welcome — code, docs, design feedback, bug reports.

## Current phase: design

Development follows a strict order (see [docs/ROADMAP.md](docs/ROADMAP.md)).
Right now the most valuable contributions are:

- Feedback on the design documents in [`docs/`](docs/)
- Feedback on the mockups in [`design/`](design/) (open an issue with screenshots)

Code contributions open up once the design is validated and milestone M1 starts.

## Ground rules

- **English only** for everything user-facing and everything in the repo: UI text,
  code, comments, commits, docs, issues.
- **Free-first:** no feature of the free tier may depend on a paid service. If a
  PR introduces a service, document its free plan.
- **Explainability:** any change to moderation behavior must keep decisions
  explainable (a human-readable reason on every action).
- **Privacy:** never add persistent storage of chat content.

## Workflow

1. Open or pick an issue; discuss the approach before large changes.
2. Fork / branch from `main`: `feat/<topic>`, `fix/<topic>`, `docs/<topic>`.
3. Follow [Conventional Commits](https://www.conventionalcommits.org/)
   (`feat: …`, `fix: …`, `docs: …`, `chore: …`).
4. Make sure `npm run lint`, `npm run typecheck` and `npm test` pass (once M1 lands).
5. Open a PR using the template. Small, focused PRs review faster.

## Code style (from M1 onward)

- TypeScript **strict**; no `any` without a justifying comment.
- ESLint + Prettier are the law — CI enforces both.
- Pure logic goes in `packages/` (framework-free); UI stays in `apps/`.
- New moderation rules ship with golden-corpus tests
  ([docs/MODERATION.md §9](docs/MODERATION.md)).

## Reporting security issues

Please do **not** open public issues for vulnerabilities — use GitHub Security
Advisories (private reporting) instead. See [docs/SECURITY.md](docs/SECURITY.md).

## License

By contributing you agree that your contributions are licensed under the
[MIT License](LICENSE).
