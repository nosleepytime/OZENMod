# Releasing OZENMod

Releases are cut by pushing a `vMAJOR.MINOR.PATCH` tag. The
[`Release`](.github/workflows/release.yml) workflow then builds the Windows and
macOS desktop installers, generates `SHA256SUMS.txt`, and creates a **draft**
GitHub Release with the artifacts attached. Nothing is public until you review
the draft and click **Publish**.

## One-time setup (for functional installers)

The desktop app authenticates with Twitch using the **device-code flow**, which
needs a public Twitch **client id** (no secret). For prebuilt installers to
connect out of the box, that client id — and the URL of your deployed web app —
are baked in at build time from repository secrets.

In **Settings → Secrets and variables → Actions**, add:

| Secret             | Value                                                            |
| ------------------ | ---------------------------------------------------------------- |
| `TWITCH_CLIENT_ID` | The client id of your Twitch application (see `SETUP.md` step 2) |
| `OZENMOD_WEB_URL`  | Your deployed web app, e.g. `https://your-app.vercel.app`        |

Both are optional. If they are unset the installers still build, but the app
will ask the user to connect and live sync stays disabled — useful for a
source-only or preview build.

> The Twitch client id is public by design (device-code flow). No client secret
> is ever shipped in the desktop app.

## Cut a release

1. Make sure `main` is green (CI) and the `CHANGELOG.md` `[Unreleased]` section
   reflects what is shipping. Move it under a dated `## [0.1.0] - YYYY-MM-DD`
   heading.
2. Confirm the version in the `package.json` files is the version you are
   tagging (currently `0.1.0`).
3. Tag and push:

   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

4. Watch the **Actions** tab. When the workflow finishes, open **Releases**,
   review the generated draft (installers + checksums attached, notes
   auto-generated), edit the notes if needed, and click **Publish**.

## Notes

- The installers are **not code-signed**. On first launch Windows SmartScreen
  and macOS Gatekeeper will warn; users choose to run anyway (standard for free,
  open-source, unsigned builds). Code signing can be added later by providing
  signing certificates as secrets and configuring electron-builder.
- To undo a mistaken tag before publishing the draft:

  ```bash
  git push --delete origin v0.1.0
  git tag -d v0.1.0
  ```

  Then delete the draft release from the GitHub UI.
