/**
 * Firebase Admin (server-only) — used by the auth callback to mint a Firebase
 * custom token after verifying the Twitch identity (docs/ARCHITECTURE.md §4).
 * The service account lives only in a server env var; it never reaches clients.
 *
 * Returns null when unconfigured so the app builds and runs without secrets and
 * surfaces a clear "authentication not configured" state instead of crashing.
 */
import 'server-only';
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let cached: App | null | undefined;

function getAdminApp(): App | null {
  if (cached !== undefined) return cached;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (!raw) {
    cached = null;
    return null;
  }
  try {
    const serviceAccount = JSON.parse(raw) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    // Vercel escapes newlines in env values; restore them.
    const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
    cached =
      getApps().length > 0
        ? getApp()
        : initializeApp({
            credential: cert({
              projectId: serviceAccount.project_id,
              clientEmail: serviceAccount.client_email,
              privateKey,
            }),
            databaseURL,
          });
    return cached;
  } catch (err) {
    console.error('[firebase-admin] failed to initialize:', err);
    cached = null;
    return null;
  }
}

export function isAdminConfigured(): boolean {
  return getAdminApp() !== null;
}

/**
 * Mint a Firebase custom token for a Twitch user. The uid is namespaced so it
 * never collides with other providers. Returns null if admin is unconfigured.
 */
export async function mintCustomToken(
  twitchUserId: string,
  claims: { login: string; displayName: string },
): Promise<string | null> {
  const app = getAdminApp();
  if (!app) return null;
  const uid = `twitch:${twitchUserId}`;
  return getAuth(app).createCustomToken(uid, {
    login: claims.login,
    displayName: claims.displayName,
  });
}
