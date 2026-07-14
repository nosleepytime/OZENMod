# OZENMod — Product Design

AI-powered, context-aware moderation for Twitch chats. Free to run, open source,
and explainable: every action the bot takes comes with a reason a human can read.

---

## 1. Vision

Twitch moderation tools are either dumb (keyword blacklists that miss context and
punish innocents) or expensive (hosted AI bots behind subscriptions). OZENMod is
neither:

- It **understands context** — conversation history, targets, irony, evasion tricks —
  instead of matching words.
- It is **free to run**: the free tier runs entirely on the streamer's computer and
  uses only services with genuine free plans.
- It is **explainable**: every decision (allow, delete, warn, timeout, ban, review)
  is logged with a human-readable reason.
- It is **open source**, built to be maintained and extended for years.

## 2. Product principles

1. **Local-first.** Messages are analyzed on the streamer's machine in milliseconds.
   The AI is called only when a message is genuinely ambiguous.
2. **Free-first.** If two solutions exist, we pick the free one. No feature of the
   free tier may require a paid service.
3. **Explainable by default.** No silent punishments. Every action carries a reason.
4. **Store almost nothing.** Chat content is not persisted. Temporary moderation
   state lives only for the current stream session and is deleted automatically.
5. **Zero-config start.** Sensible defaults; a streamer can go from download to a
   protected chat in under five minutes.
6. **English only.** All UI, messages, errors, logs, e-mails and documentation are
   written in English.
7. **Extensible.** New AI providers, new rules and (later) a hosted premium runtime
   plug into stable interfaces instead of rewrites.

## 3. Tiers

### Free tier (now)

- The streamer downloads the official **desktop app** (Windows, macOS).
- They open the app before streaming and leave it running; the entire bot
  (Twitch chat client, moderation engine, AI calls) runs on their computer.
- Firebase Realtime Database (free Spark plan) stores only settings and small
  live-session aggregates so the **web dashboard** stays in sync.
- Default AI provider is **Pollinations** (free, no API key). Users may plug their
  own OpenAI / Anthropic / Gemini / Ollama / custom keys — always optional.
- Server cost: ~$0. The website and auth endpoints run on Vercel's free plan.

### Premium tier (future — architecture only, no development now)

- A **hosted runtime** runs the same moderation engine 24/7 in the cloud, so the
  streamer does not need the desktop app open.
- The engine packages (`core`, `twitch`, `ai`) are platform-agnostic today
  precisely so they can be deployed server-side later without changes.
- No premium feature is implemented in v1; only the extension points exist
  (see [ARCHITECTURE.md §9](./ARCHITECTURE.md#9-premium-ready-extension-points)).

## 4. The three surfaces

| Surface | Role | Runs on |
| --- | --- | --- |
| **Website + dashboard** | Marketing, downloads, sign-in, remote configuration, statistics, moderation history | Vercel (free) |
| **Desktop app** | Hosts the bot during streams, local control room, logs, settings | Streamer's computer (Windows/macOS) |
| **The bot** | IRC chat client + moderation engine + AI escalation | Inside the desktop app (free tier) |

Settings are shared: change a rule on the dashboard while live and the running bot
picks it up within a minute; change it in the app and the dashboard reflects it.

---

## 5. Website structure

Next.js app, dark theme by default, fully responsive.

### 5.1 Public pages

| Route | Page | Purpose / key content |
| --- | --- | --- |
| `/` | **Landing** | Hero with value proposition, live-looking product preview, feature grid, "How it works" (3 steps), AI providers strip, Free vs Premium comparison, FAQ, final call to action, footer. |
| `/download` | **Download** | Platform detection, Windows `.exe` / macOS `.dmg` buttons (GitHub Releases), system requirements, install notes (unsigned-build instructions), checksums link. |
| `/login` | **Sign in** | Single "Continue with Twitch" action, short scope explanation, links to privacy/terms. |
| `/auth/callback` | OAuth callback | Spinner + error states (denied, expired, network). Redirects to `/dashboard`. |
| `/privacy` | Privacy policy | What we store (almost nothing), retention, deletion. |
| `/terms` | Terms of use | Standard OSS terms. |
| `/404`, `/500` | Error pages | Branded, helpful, with a way back. |

### 5.2 Dashboard pages (authenticated)

Persistent left sidebar (Overview, Moderation, AI & Providers, Filters, Settings) +
top bar (channel identity, live status, session timer, bot status, account menu).

| Route | Page | Purpose / key content |
| --- | --- | --- |
| `/dashboard` | **Overview** | Stat tiles (messages analyzed, actions taken, AI calls + % of messages, chatters warned), chat activity chart, "resolved locally vs AI" meter, actions breakdown, recent actions table, human-review queue, bot/app status card. |
| `/dashboard/moderation` | **Moderation** | Filterable event history (search, category, action, source), event detail panel with full explanation, context and confidence; undo / ban / mark-false-positive actions; pagination. |
| `/dashboard/ai` | **AI & Providers** | Provider cards (Pollinations default-free, OpenAI, Anthropic, Gemini, Ollama, Custom), active model, connection test, sensitivity (lenient/balanced/strict), category toggles + thresholds, AI budget (max calls/min), fallback behavior. |
| `/dashboard/filters` | **Filters** | Banned terms & regex manager (with severity), link policy (block all / trusted list / allow), trusted domains, spam & flood thresholds (caps %, emote %, repetition, rate), exemptions (mods, VIPs, subscribers, regulars). |
| `/dashboard/settings` | **Settings** | Channel & bot identity, warning ladder editor (see §8.3), timeout durations, permanent-vs-session data explanation, notifications, data & privacy (snippet storage toggle, delete-all-data), danger zone (disconnect Twitch). |

Notes:
- API keys for BYO providers are **never entered on the website** — they stay on the
  streamer's machine (see [SECURITY.md](./SECURITY.md)). The dashboard shows which
  provider is active but key entry happens in the desktop app.
- The dashboard is read-mostly and cheap: it renders from small aggregate nodes
  (see [DATABASE.md](./DATABASE.md)).

## 6. Desktop application structure

Electron app (Windows NSIS installer, macOS DMG), tray-capable, dark theme.

### 6.1 Windows & views

| View | Purpose / key content |
| --- | --- |
| **Onboarding wizard** | 3 steps — ① Welcome & what the app does, ② Connect Twitch via device code (`twitch.tv/activate`, code shown big, "waiting for authorization…" state, optional dedicated bot account), ③ Ready — channel confirmed, defaults applied, "Open dashboard" link. Shown on first run only. |
| **Control Room (main)** | Status hero: protection state, channel, session timer, Twitch / AI / EventSub health chips; big **Start bot / Stop bot** button; quick stats (messages, actions, AI calls, review queue); live moderation feed (chat events with inline decisions and reasons); human-review card with Approve/Remove; system card (CPU, memory, latency, version, update state). |
| **Logs** | Console-style, filterable by level (Info, Action, AI, Warning, Error), search, auto-scroll toggle, export to file. Local only. |
| **Settings** | Tabs: **General** (launch at login, auto-start bot when stream goes live, minimize to tray, desktop notifications, update channel + check now), **Moderation** (same rule editor as dashboard, kept in sync), **AI** (provider picker, model, API key entry stored in OS keychain, test connection), **Advanced** (log retention, local data folder, diagnostics). |
| **About** | Version, changelog link, licenses, credits, links to GitHub/docs. |

### 6.2 Behaviors

- **Session lifecycle:** the app subscribes to Twitch EventSub (WebSocket). When the
  stream goes online it can auto-start the bot; when it goes offline it finalizes the
  session — applies pending state, writes a compact session summary, and deletes the
  temporary session data from Firebase (see [DATABASE.md §4](./DATABASE.md)).
- **Tray:** closing the window can minimize to tray (configurable); the tray icon
  reflects bot state (idle / protecting / attention needed).
- **Updates:** the app checks GitHub Releases. Windows: silent download + install on
  restart. macOS: notification + one-click open of the download page (auto-install
  requires paid code signing, which the free tier does not assume — documented in
  [SECURITY.md §8](./SECURITY.md)).
- **Offline resilience:** if Firebase is unreachable the bot keeps moderating with
  its local config copy; sync resumes automatically.

## 7. Full feature list

### Moderation engine
- Real-time analysis of every chat message (target: < 5 ms local decision).
- Context-aware AI escalation for ambiguous messages only.
- Detects: insults, harassment, threats, discrimination/hate, sexual content,
  spam, flood, advertising, suspicious links, scams, phishing, trolling,
  banned-word evasion (leetspeak, homoglyphs, zero-width tricks, spacing),
  special-character abuse, repetition, global toxicity, targeted toxicity,
  irony/sarcasm when detectable from context.
- Decisions: allow, ignore, delete, warn, timeout, ban, flag for human review.
- Every decision includes an English explanation, shown in feed, logs and dashboard.
- Configurable warning ladder (per-stream), severity bypass for extreme content,
  exemptions, cooldowns, first-time-chatter sensitivity.

### AI system
- Modular providers: Pollinations (default, free, keyless), OpenAI, Anthropic,
  Gemini, Ollama (local), custom OpenAI-compatible endpoint.
- Strict JSON verdict contract, response validation, timeouts, retry, circuit
  breaker, graceful fallback to conservative local mode.
- AI budget controls (max calls/minute) and live "resolved locally vs AI" metric.

### Desktop app
- Twitch device-code sign-in (streamer account or dedicated bot account).
- One-click start/stop, auto start/stop on stream online/offline.
- Live feed with decisions and reasons, human-review queue, logs, stats.
- Settings synced with dashboard; API keys stored in the OS keychain.
- Auto-updates from GitHub Releases; tray mode; desktop notifications.

### Website & dashboard
- Twitch sign-in, live session view, statistics, moderation history with
  explanations, full rule configuration, provider selection, data controls.
- Download page with platform detection and checksums.

### Platform & quality
- 100% TypeScript strict, ESLint + Prettier, tests for the engine's rule stages.
- Open source: README, CONTRIBUTING, LICENSE (MIT), CHANGELOG, issue & PR templates.
- GitHub Actions: CI on every PR; release workflow builds Windows + macOS
  installers and publishes a GitHub Release automatically.

## 8. UX design

### 8.1 Design language

- **Dark by default** (near-black `#0A0A0F` base, elevated surfaces, hairline borders).
- Brand accent: **violet** `#7C5CFF` with a subtle gradient toward `#A78BFA`;
  Twitch purple `#9146FF` is reserved for Twitch-branded actions only.
- Status colors: green = healthy/allowed, amber = warning/timeout, red = ban/error,
  blue = info/AI. Status is never conveyed by color alone (icon + label always).
- Typeface: **Inter**; monospace for logs and codes.
- Motion: fast, subtle (150–250 ms), no gratuitous animation; respects
  `prefers-reduced-motion`.
- Charts follow the project's data-viz rules: validated palette
  (`#9085e9` / `#199e70` on dark surfaces), thin marks, direct labels, no dual axes.

### 8.2 Interaction principles

- **Status first:** the most important pixel is "is my chat protected right now?" —
  both app and dashboard lead with a live status hero.
- **One primary action per screen** (Start bot, Save changes, Continue with Twitch).
- **Explanations everywhere:** every moderation row expands to "why".
- **Undo over confirm:** deletions of messages can be undone (re-approve user,
  unban) rather than blocked by confirmation dialogs; destructive account-level
  actions (disconnect, delete data) require explicit confirmation.
- **Empty states teach:** a brand-new dashboard explains what will appear and how
  to start the app.

### 8.3 Warning ladder (user-facing model)

Streamers pick one of two modes (both session-scoped by default):

- **Mode A — Warnings then sanction:** Strike 1 → chat warning; Strike 2 → chat
  warning; Strike 3 (max, configurable 1–5) → final action (timeout N minutes or ban).
- **Mode B — Escalating timeouts:** Strike 1 → short timeout (e.g. 10 s);
  Strike 2 → longer (e.g. 5 min); Strike 3 → final action (long timeout or ban).

When the final action fires — or when the stream ends — the user's temporary
warning data is deleted automatically (see [DATABASE.md §4](./DATABASE.md)).
Severe categories (threats, doxxing, slurs, scam links) skip the ladder.

## 9. User flows

### 9.1 First-run (download → protected chat)

1. Visitor lands on `/`, clicks **Download for Windows/macOS**.
2. Installs and opens the app → Onboarding step 1 (what OZENMod does).
3. Step 2: app shows a device code + **Open twitch.tv/activate**; user authorizes
   (streamer account, or signs in with a dedicated bot account and then names the
   channel to protect).
4. Step 3: defaults applied ("Balanced" sensitivity, Mode A ladder 3 strikes,
   links blocked for non-subs). App lands on Control Room, bot **idle**.
5. User clicks **Start bot** (or enables auto-start). Status hero turns green:
   *Protecting #channel*.

### 9.2 Daily stream session

1. Streamer opens the app (or it launched at login) and goes live.
2. EventSub fires `stream.online` → bot auto-starts (if enabled), a **session**
   node is created in Firebase.
3. During the stream: messages are analyzed locally; ambiguous ones go to the AI;
   actions are applied via Twitch APIs and appear in the live feed and dashboard
   with reasons; counters update periodically.
4. Stream ends → EventSub fires `stream.offline` → bot writes a compact session
   summary, deletes all temporary session data (warnings, counters, recent events)
   and returns to idle. The streamer closes the app.

### 9.3 Warning escalation (Mode A example, max 3)

1. `troll_user` posts a targeted insult → engine: **Warn (1/3)** — bot deletes the
   message and posts "@troll_user warning 1/3: targeted insult".
2. Second insult → **Warn (2/3)**, same treatment, reason logged.
3. Third → **final action**: timeout 30 min (as configured), reason
   "Reached 3/3 warnings this stream — repeated harassment".
4. The user's warning record is deleted immediately after the final action;
   only anonymous counters remain in the session summary.

### 9.4 Human review

1. The engine meets a genuinely uncertain case (e.g. possible irony, AI confidence
   below threshold) → decision **Review**: the message is left up (or held,
   configurable), and appears in the review queue (app + dashboard) with context.
2. Streamer/mod clicks **Approve** (nothing happens, feedback recorded) or
   **Remove** (delete + optional strike).
3. Queue entries expire with the session; they are never stored permanently.

### 9.5 Remote settings change while live

1. Streamer's mod opens the dashboard mid-stream, raises spam sensitivity.
2. Config write lands in Firebase; the bot's config poller picks it up within
   60 s (ETag-cheap), applies it live and logs "Settings updated from dashboard".

### 9.6 Web sign-in

1. `/login` → **Continue with Twitch** → Twitch OAuth consent → callback.
2. Serverless endpoint exchanges the code, verifies identity, mints a Firebase
   custom token; browser signs into Firebase and loads `/dashboard`.

### 9.7 Update flow

- App checks GitHub Releases on launch and every 6 h.
- Windows: downloads in background → "Update ready — restart to apply".
- macOS: "Version X is available" → opens the release download.

### 9.8 Disconnect & data deletion

1. Settings → Danger zone → **Disconnect Twitch** (confirmation required).
2. App revokes tokens, clears the keychain, deletes the channel's Firebase data
   (config, stats, sessions), and returns to onboarding. The same deletion is
   available from the dashboard.

## 10. Out of scope for v1

- Hosted premium runtime (architecture only), payments, team/mod-role accounts,
  YouTube/Kick/Discord support, mobile apps, custom ML model training,
  multi-language UI (English only by design), chat overlays.
