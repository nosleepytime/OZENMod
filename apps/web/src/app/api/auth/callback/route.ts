import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, getTwitchIdentity, readTwitchConfig } from '@/lib/twitch-oauth';
import { isAdminConfigured, mintCustomToken } from '@/lib/firebase-admin';

// Firebase Admin needs the Node.js runtime (not edge).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Twitch OAuth callback (docs/ARCHITECTURE.md §4):
 *  1. Validate the CSRF state cookie.
 *  2. Exchange the code for a Twitch access token (secret stays server-side).
 *  3. Read the Twitch identity.
 *  4. Mint a Firebase custom token for uid `twitch:<id>`.
 *  5. Hand the custom token to the client (short-lived cookie) and redirect to
 *     the dashboard, which signs in with it and provisions the account.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const fail = (error: string) => NextResponse.redirect(new URL(`/login?error=${error}`, appUrl));

  if (searchParams.get('error')) return fail(encodeURIComponent(searchParams.get('error')!));

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const savedState = req.cookies.get('ozenmod_oauth_state')?.value;
  if (!code || !state || !savedState || state !== savedState) return fail('invalid_state');

  const config = readTwitchConfig();
  if (!config) return fail('twitch_not_configured');
  if (!isAdminConfigured()) return fail('firebase_not_configured');

  try {
    const accessToken = await exchangeCode(config, code);
    const identity = await getTwitchIdentity(config, accessToken);
    const customToken = await mintCustomToken(identity.id, {
      login: identity.login,
      displayName: identity.displayName,
    });
    if (!customToken) return fail('firebase_not_configured');

    const res = NextResponse.redirect(new URL('/dashboard', appUrl));
    res.cookies.delete('ozenmod_oauth_state');
    // Short-lived, single-use handoff of the custom token to the client, which
    // exchanges it for a Firebase session and then clears the cookie.
    res.cookies.set('ozenmod_ct', customToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 120,
    });
    // Non-sensitive profile hint so the dashboard can provision the RTDB node.
    res.cookies.set(
      'ozenmod_profile',
      JSON.stringify({
        twitchUserId: identity.id,
        login: identity.login,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 120,
      },
    );
    return res;
  } catch (err) {
    console.error('[auth/callback]', err);
    return fail('exchange_failed');
  }
}
