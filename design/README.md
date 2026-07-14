# OZENMod — Design Mockups

High-fidelity, static HTML/CSS mockups of the OZENMod website and desktop
application. These are the visual reference for milestone M1+ development —
**nothing here is functional code**.

## Structure

```
design/
├── mockups/
│   ├── shared/          # design tokens, components, Inter font (single source of truth)
│   ├── web/             # website & dashboard screens
│   │   ├── landing.html         Landing page (marketing)
│   │   ├── login.html           Sign in with Twitch
│   │   ├── dashboard.html       Dashboard — Overview
│   │   ├── moderation.html      Dashboard — Moderation history + event detail
│   │   ├── ai-providers.html    Dashboard — AI & Providers
│   │   └── settings.html        Dashboard — Settings (ladder, privacy, danger zone)
│   └── desktop/         # desktop app screens (Electron)
│       ├── onboarding.html      First run — Twitch device-code connection
│       ├── main.html            Control Room (status, feed, review, system)
│       ├── logs.html            Logs console
│       └── settings.html        App settings (General tab)
└── screenshots/         # rendered PNGs of every screen (review these)
```

## Viewing

Open any `.html` file in a browser — no build step, no dependencies.
Everything is plain HTML/CSS with the shared stylesheets in `mockups/shared/`.

## Regenerating screenshots

Screenshots are rendered with Playwright + Chromium (viewport 1600×1000 for web,
1440×900 for desktop):

```bash
node design/screenshot.mjs
```

## Design system notes

- Dark theme by default; tokens in `mockups/shared/tokens.css`.
- Brand accent `#7C5CFF`; Twitch purple `#9146FF` reserved for Twitch actions.
- Chart series colors (`#9085E9`, `#199E70`) are CVD-validated against the card
  surface `#14141F` (lightness band, chroma, adjacent-pair separation, contrast).
- Status is never conveyed by color alone — icon + label everywhere.
- Typeface: Inter (variable, latin subset, OFL license) — bundled in `shared/fonts/`.
