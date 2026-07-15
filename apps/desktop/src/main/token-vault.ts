/**
 * Token vault — Twitch OAuth tokens encrypted at rest with Electron
 * `safeStorage` (Keychain on macOS, DPAPI on Windows), stored in the app's
 * userData directory (docs/SECURITY.md §2). Tokens never touch Firebase.
 */
import { app, safeStorage } from 'electron';
import { join } from 'node:path';
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import type { TwitchTokens } from '@ozenmod/twitch';

const FILE = () => join(app.getPath('userData'), 'twitch-tokens.enc');

export function loadTokens(): TwitchTokens | null {
  try {
    const path = FILE();
    if (!existsSync(path)) return null;
    const encrypted = readFileSync(path);
    if (!safeStorage.isEncryptionAvailable()) return null;
    const json = safeStorage.decryptString(encrypted);
    return JSON.parse(json) as TwitchTokens;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: TwitchTokens): void {
  if (!safeStorage.isEncryptionAvailable()) {
    console.error('[vault] OS encryption unavailable — refusing to store tokens in plaintext');
    return;
  }
  const encrypted = safeStorage.encryptString(JSON.stringify(tokens));
  writeFileSync(FILE(), encrypted);
}

export function clearTokens(): void {
  try {
    const path = FILE();
    if (existsSync(path)) rmSync(path);
  } catch {
    /* ignore */
  }
}
