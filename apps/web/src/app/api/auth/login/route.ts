import { NextResponse } from 'next/server';
import { buildAuthorizeUrl, randomState, readTwitchConfig } from '@/lib/twitch-oauth';

/**
 * Starts the Twitch OAuth flow. When the Twitch app credentials are configured
 * this redirects to Twitch with a CSRF state cookie; until then (M1) it points
 * the user at the demo dashboard so the site is fully navigable without secrets.
 */
export function GET() {
  const config = readTwitchConfig();
  if (!config) {
    return NextResponse.redirect(
      new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
    );
  }

  const state = randomState();
  const res = NextResponse.redirect(buildAuthorizeUrl(config, state));
  res.cookies.set('ozenmod_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return res;
}
