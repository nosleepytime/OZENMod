import { NextRequest, NextResponse } from 'next/server';
import { readTwitchConfig } from '@/lib/twitch-oauth';

/**
 * Twitch OAuth callback. Validates the CSRF state, then (in milestone M4)
 * exchanges the code for tokens, verifies the Twitch identity and mints a
 * Firebase custom token. The token exchange is intentionally not implemented
 * yet — this route validates its inputs and returns a clear, English error
 * until Firebase is wired.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const error = searchParams.get('error');
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, appUrl));
  }

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const savedState = req.cookies.get('ozenmod_oauth_state')?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', appUrl));
  }

  const config = readTwitchConfig();
  if (!config) {
    return NextResponse.redirect(new URL('/login?error=not_configured', appUrl));
  }

  // M4: exchange `code` at id.twitch.tv/oauth2/token, verify the user with the
  // Helix /users endpoint, mint a Firebase custom token and set the session.
  return NextResponse.json(
    {
      status: 'not_implemented',
      message:
        'Twitch sign-in is not wired to Firebase yet (milestone M4). The OAuth flow and CSRF check are in place; token exchange lands with the database integration.',
    },
    { status: 501 },
  );
}
