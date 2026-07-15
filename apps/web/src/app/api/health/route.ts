import { NextResponse } from 'next/server';

/**
 * Lightweight health/version endpoint used by the desktop app's connectivity
 * check and uptime monitors. Reports which integrations are configured (never
 * their secrets).
 */
export function GET() {
  return NextResponse.json({
    name: 'ozenmod-web',
    status: 'ok',
    version: '0.1.0',
    time: new Date().toISOString(),
    integrations: {
      twitch: Boolean(process.env.TWITCH_CLIENT_ID),
      firebase: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
    },
  });
}
