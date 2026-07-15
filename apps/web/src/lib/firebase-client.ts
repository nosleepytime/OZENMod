'use client';

/**
 * Firebase client SDK setup (browser). Public config comes from NEXT_PUBLIC_*
 * env vars — safe to ship; security is enforced by RTDB rules, not secrecy
 * (docs/SECURITY.md §6). Everything is lazy so the app runs unconfigured and can
 * show a "connect Firebase" state instead of crashing.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  appId: string;
}

export function readWebConfig(): FirebaseWebConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  if (!apiKey || !projectId || !databaseURL || !appId) return null;
  return {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? `${projectId}.firebaseapp.com`,
    databaseURL,
    projectId,
    appId,
  };
}

export function isFirebaseConfigured(): boolean {
  return readWebConfig() !== null;
}

let app: FirebaseApp | null = null;

function getClientApp(): FirebaseApp | null {
  const config = readWebConfig();
  if (!config) return null;
  if (app) return app;
  app = getApps().length > 0 ? getApp() : initializeApp(config);
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const a = getClientApp();
  return a ? getAuth(a) : null;
}

export function getFirebaseDb(): Database | null {
  const a = getClientApp();
  return a ? getDatabase(a) : null;
}
