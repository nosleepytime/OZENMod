# OZENMod — Security Model

What we protect, how, and the honest trade-offs of an all-free stack.

---

## 1. Assets & threat model (summary)

| Asset | Threats | Primary defenses |
| --- | --- | --- |
| Twitch OAuth tokens | theft from disk, exfiltration | OS keychain (`safeStorage`), never in RTDB/logs, minimal scopes |
| Channel control (mod powers) | hijacked bot banning viewers | scoped tokens, rate limits, explainable audit trail, human review |
| Streamer data in Firebase | cross-user access, scraping | per-uid security rules, no public nodes, custom-token auth |
| Vercel auth endpoints | code replay, token minting abuse | state/PKCE, Twitch-side verification, rate limiting |
| The AI decision | prompt injection via chat | data-fencing, schema-validated verdicts, no tool access |
| Release binaries | tampering | GitHub Releases + SHA256SUMS; signing documented as a paid upgrade |

## 2. Authentication & tokens

- **Desktop:** Twitch **Device Code Grant** — no client secret exists in the app.
  Access + refresh tokens are encrypted at rest with Electron `safeStorage`
  (Keychain on macOS, DPAPI on Windows). Tokens are refreshed proactively and
  **revoked** (`/oauth2/revoke`) on disconnect.
- **Web:** Authorization Code flow with `state` (CSRF) handled by a Vercel
  serverless route; the **client secret lives only in Vercel env vars**. The route
  verifies the Twitch identity (`/oauth2/validate` + Helix `GET /users`) and mints
  a **Firebase custom token** whose `uid` is derived from the Twitch user id.
- **Firebase session:** both surfaces authenticate to RTDB with that custom token;
  security rules are therefore identical for app and dashboard.
- **Scopes are minimal** and listed in [ARCHITECTURE.md §5.2](./ARCHITECTURE.md);
  the app requests nothing it does not use, and re-consent is required if a future
  version needs more.

## 3. Secrets management

- Repository: **zero secrets**. `.env.example` documents required variables;
  CI uses GitHub Actions secrets; web uses Vercel env vars.
- Desktop: the only secrets are user tokens/API keys → keychain, never files.
- AI provider keys: entered in the desktop app only, stored in the keychain,
  **never synced** to Firebase (rules explicitly reject key-shaped fields as
  defense in depth — see [DATABASE.md §7](./DATABASE.md)).
- Logs and feed events pass through a **redaction filter** (token patterns,
  `oauth:` strings, provider key prefixes) before display or export.

## 4. Database security

- Rules deny by default; `channels/{uid}` and `sessions/{uid}` are readable and
  writable **only** by `auth.uid === uid`. No public reads anywhere.
- Structural validation in rules (bounds, types, forbidden fields) backstops the
  zod validation performed by every client.
- The dashboard never receives another channel's data; there are no shared indexes.

## 5. Desktop app hardening

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` for the
  renderer; a **typed, allowlisted IPC bridge** is the only capability surface.
- Strict CSP in the renderer; external navigation blocked
  (`setWindowOpenHandler` allowlist: twitch.tv, github.com, project site).
- Auto-update artifacts are fetched from GitHub Releases over HTTPS only.
- No remote code: providers return JSON verdicts, never executable content.

## 6. Web app hardening

- Standard Next.js protections + strict CSP, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`.
- Auth routes: `state` verification, short-lived codes, IP-based rate limiting
  (in-memory per instance + Twitch's own limits), no token logging.
- Firebase web config is public by design; security comes from rules, not secrecy.

## 7. Privacy

- **Chat content is not stored.** The rolling context window lives in process
  memory only. Optional dashboard snippets are truncated to 80 chars and off by
  default ([DATABASE.md §1](./DATABASE.md)).
- Temporary moderation data (warnings, counters, queues) is deleted automatically
  at final action / stream end.
- **Right to disappear:** "Delete all my data" (app + dashboard) wipes
  `channels/{uid}` and `sessions/{uid}`, revokes tokens and clears the keychain.
- The privacy policy page states exactly this, in plain English.

## 8. Release integrity (free-tier honesty)

- Every release ships `SHA256SUMS.txt` generated in CI; the download page links it.
- **Code signing costs money** (Apple notarization requires a paid developer
  account; Windows EV certs are paid), so free-tier builds are unsigned:
  - Windows: SmartScreen "unknown publisher" — documented with screenshots on the
    download page; auto-update still works.
  - macOS: Gatekeeper requires right-click → Open on first launch — documented;
    auto-update is replaced by notify + download (see [ARCHITECTURE.md §8](./ARCHITECTURE.md)).
- The build pipeline is public (GitHub Actions on a public repo), so anyone can
  audit exactly what produced a binary. Signing becomes a config flip if the
  project later acquires certificates.

## 9. AI prompt-injection defenses

Chat is hostile input. The AI layer treats it accordingly:

1. Messages are **data, never instructions**: fenced in the prompt, role markers
   stripped, explicit system instruction to ignore embedded commands.
2. The model can only return a **schema-validated JSON verdict** about the message;
   there are no tools, no URLs fetched, no actions the model can trigger directly.
3. The decision engine — not the model — applies policy: even a hostile "ban"
   verdict passes through ladder/cooldown/severity logic and the audit trail.
4. Verdict `reason` strings are rendered as plain text (no markdown/HTML injection
   into dashboards).

## 10. Supply chain & process

- Lockfile committed; Dependabot + `npm audit` in CI; GitHub Actions pinned to
  major versions; CodeQL enabled (free for public repos).
- No postinstall scripts in our packages; third-party postinstalls reviewed.
- `SECURITY.md` at repo root will define private vulnerability reporting
  (GitHub Security Advisories) when development starts.
