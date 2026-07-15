# Setting up OZENMod

OZENMod is free to run, but it connects to **your own** Twitch application and
**your own** Firebase project. Nobody else's keys are involved, and nothing here
costs money — every service below is used strictly within its free tier.

This guide takes about 15 minutes. When you finish you will have:

- a working sign-in ("Continue with Twitch") on the website,
- a dashboard that reads your real channel data from Firebase,
- the desktop app connected to your channel and moderating live chat.

You do **not** need any of this to browse the code or run the marketing site —
the app builds and runs unconfigured and simply shows a "not configured" state
on the dashboard until the variables below are set.

---

## 1. Prerequisites

- **Node.js 20+** and npm (`node --version`).
- A **Twitch account** (the channel you want to moderate).
- A free **Google account** (for Firebase).

Clone and install:

```bash
git clone https://github.com/nosleepytime/ozenmod.git
cd ozenmod
npm install
```

---

## 2. Create a Twitch application

1. Go to the [Twitch Developer Console](https://dev.twitch.tv/console/apps) and
   click **Register Your Application**.
2. **Name**: anything (e.g. `OZENMod – <your channel>`).
3. **OAuth Redirect URLs**: add exactly

   ```
   http://localhost:3000/api/auth/callback
   ```

   Add your production URL too once you deploy, e.g.
   `https://your-app.vercel.app/api/auth/callback`.

4. **Category**: _Chat Bot_.
5. **Client Type**: _Confidential_.
6. Click **Create**, then open the app and copy the **Client ID**. Click **New
   Secret** to generate the **Client Secret**.

Keep both values — they become `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`.

---

## 3. Create a Firebase project

1. Open the [Firebase console](https://console.firebase.google.com/) and click
   **Add project**. Give it a name; you can disable Google Analytics.
2. **Realtime Database** (left menu → _Build → Realtime Database_):
   - Click **Create Database**.
   - Choose a location.
   - Start in **Locked mode** (the rules in this repo replace the defaults in
     step 4).
   - Copy the database URL shown at the top, e.g.
     `https://your-project-default-rtdb.firebaseio.com`. This is
     `NEXT_PUBLIC_FIREBASE_DATABASE_URL`.
3. **Authentication** (_Build → Authentication_):
   - Click **Get started**. No providers need to be enabled — OZENMod signs in
     with **custom tokens** minted by your server after Twitch verifies the
     user. Getting started is enough to activate the Auth service.
4. **Web app config** (_Project settings → General → Your apps → Web `</>`_):
   - Register a web app (nickname only; skip Hosting).
   - From the shown `firebaseConfig`, copy:
     - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`
5. **Service account** (_Project settings → Service accounts_):
   - Click **Generate new private key** → a JSON file downloads.
   - This whole JSON becomes `FIREBASE_SERVICE_ACCOUNT_JSON` (see step 5 for how
     to put it on one line). Treat it like a password — it is server-only and
     never sent to the browser.

---

## 4. Deploy the database security rules

The repo ships [`database.rules.json`](./database.rules.json). It restricts every
channel's data to its owner: a signed-in streamer can only read and write
`channels/<their-uid>` and `sessions/<their-uid>`.

**Easiest (console):** open _Realtime Database → Rules_, paste the contents of
`database.rules.json`, and click **Publish**.

**Or with the Firebase CLI:**

```bash
npm i -g firebase-tools
firebase login
firebase use --add            # pick your project
firebase deploy --only database
```

> Security here comes from these rules, not from hiding the `NEXT_PUBLIC_*`
> values. Those are meant to be public.

---

## 5. Configure the website locally

Copy the template and fill it in:

```bash
cp .env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:

| Variable                            | Where it comes from                          |
| ----------------------------------- | -------------------------------------------- |
| `TWITCH_CLIENT_ID`                  | Twitch app (step 2)                          |
| `TWITCH_CLIENT_SECRET`              | Twitch app (step 2)                          |
| `NEXT_PUBLIC_APP_URL`               | `http://localhost:3000` for local dev        |
| `FIREBASE_SERVICE_ACCOUNT_JSON`     | Service account JSON (step 3.5), single line |
| `NEXT_PUBLIC_FIREBASE_API_KEY`      | Firebase web config (step 3.4)               |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`   | Firebase web config (step 3.4)               |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Realtime Database URL (step 3.2)             |
| `NEXT_PUBLIC_FIREBASE_APP_ID`       | Firebase web config (step 3.4)               |

**Putting the service account on one line.** `.env` values are single-line, so
collapse the JSON:

```bash
# prints the JSON as one line — paste the result after FIREBASE_SERVICE_ACCOUNT_JSON=
node -e "console.log(JSON.stringify(require('./path/to/serviceAccount.json')))"
```

Wrap it in single quotes in the file:

```
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...", ...}'
```

Run the site:

```bash
npm run dev --workspace web
# open http://localhost:3000, click "Continue with Twitch"
```

The first sign-in **is** the sign-up: OZENMod creates your `channels/<uid>`
profile and default configuration automatically.

---

## 6. Deploy to Vercel (free)

1. Import the repository at [vercel.com/new](https://vercel.com/new). The root
   [`vercel.json`](./vercel.json) already tells Vercel to build only the web app.
2. In **Settings → Environment Variables**, add every variable from step 5.
   Set `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g.
   `https://your-app.vercel.app`).
3. Add `https://your-app.vercel.app/api/auth/callback` to the Twitch app's
   **OAuth Redirect URLs** (step 2).
4. Redeploy.

---

## 7. Connect the desktop app

The desktop app runs the bot on your own computer — no server bill, and your
Twitch tokens stay in your OS keychain.

```bash
npm run dev --workspace desktop     # develop
npm run build --workspace desktop   # package a local build
```

Prebuilt Windows and macOS installers are attached to each
[GitHub release](https://github.com/nosleepytime/ozenmod/releases).

On first launch the app walks you through connecting your Twitch account (device
code flow — no secret needed on the desktop) and points it at the same Firebase
project. Once connected, the desktop bot writes live session data to Firebase and
your dashboard lights up in real time.

---

## Troubleshooting

- **Dashboard says "not configured".** One or more `NEXT_PUBLIC_FIREBASE_*`
  values are missing. They must be present at **build time** for Next.js to
  inline them — redeploy after adding them on Vercel.
- **Sign-in redirects to `/login?error=...`.** Check that the redirect URL in
  the Twitch app matches `NEXT_PUBLIC_APP_URL` + `/api/auth/callback` exactly
  (scheme, host, port, no trailing slash), and that `FIREBASE_SERVICE_ACCOUNT_JSON`
  is valid one-line JSON.
- **`permission denied` writing to the database.** Publish `database.rules.json`
  (step 4) and make sure you are signed in.
- **Dashboard stays empty after sign-in.** That is expected until the desktop
  bot runs — the website only reads data; the desktop app produces it.
