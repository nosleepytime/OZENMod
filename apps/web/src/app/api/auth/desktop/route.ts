/**
 * Desktop authentication bridge. The desktop bot has no server secret, so it
 * posts its Twitch access token here; the server verifies the Twitch identity,
 * mints a Firebase custom token for uid `twitch:<id>`, and returns it together
 * with the public Firebase config the desktop needs to sign in and write.
 *
 * Security: the Twitch token proves the caller owns the channel; the custom
 * token is scoped to that channel's uid, and RTDB rules keep it to its own data.
 */
import { NextResponse } from 'next/server';
import { readTwitchConfig, getTwitchIdentity } from '@/lib/twitch-oauth';
import { mintCustomToken, isAdminConfigured } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  const twitch = readTwitchConfig();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (!twitch || !isAdminConfigured() || !apiKey || !databaseURL) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  let accessToken: string;
  try {
    const body = (await request.json()) as { accessToken?: unknown };
    if (typeof body.accessToken !== 'string' || body.accessToken.length === 0) {
      return NextResponse.json({ error: 'missing_access_token' }, { status: 400 });
    }
    accessToken = body.accessToken;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  try {
    const identity = await getTwitchIdentity(twitch, accessToken);
    const customToken = await mintCustomToken(identity.id, {
      login: identity.login,
      displayName: identity.displayName,
    });
    if (!customToken) {
      return NextResponse.json({ error: 'not_configured' }, { status: 503 });
    }
    return NextResponse.json({
      customToken,
      apiKey,
      databaseURL,
      profile: {
        twitchUserId: identity.id,
        login: identity.login,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
      },
    });
  } catch {
    // A bad or expired Twitch token lands here.
    return NextResponse.json({ error: 'twitch_verification_failed' }, { status: 401 });
  }
}
