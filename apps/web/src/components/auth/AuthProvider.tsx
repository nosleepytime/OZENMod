'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  onAuthStateChanged,
  signInWithCustomToken,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { paths, defaultConfig } from '@ozenmod/database';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase-client';

export interface AuthUser {
  uid: string;
  login: string;
  displayName: string;
  avatarUrl: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]!) : null;
}
function deleteCookie(name: string): void {
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

interface StoredProfile {
  twitchUserId: string;
  login: string;
  displayName: string;
  avatarUrl: string;
}

/**
 * Ensure the channel's profile + default config exist (first sign-in = sign-up),
 * then return the profile from RTDB — the source of truth for the signed-in user.
 */
async function provisionAndLoadProfile(uid: string): Promise<StoredProfile | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const profileRef = ref(db, paths.profile(uid));
  const existing = await get(profileRef);
  if (existing.exists()) {
    deleteCookie('ozenmod_profile');
    return existing.val() as StoredProfile;
  }
  const profileCookie = readCookie('ozenmod_profile');
  if (!profileCookie) return null;
  const p = JSON.parse(profileCookie) as StoredProfile;
  const now = Date.now();
  await set(profileRef, { ...p, connectedAt: now });
  await set(ref(db, paths.config(uid)), defaultConfig(now));
  await set(ref(db, paths.lifetime(uid)), {
    messagesAnalyzed: 0,
    actionsTaken: 0,
    aiCalls: 0,
    sessions: 0,
    firstSessionAt: now,
  });
  deleteCookie('ozenmod_profile');
  return p;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    // Complete the OAuth handoff: exchange the custom token cookie for a session.
    const ct = readCookie('ozenmod_ct');
    if (ct) {
      deleteCookie('ozenmod_ct');
      void signInWithCustomToken(auth, ct).catch((err) =>
        console.error('[auth] sign-in failed', err),
      );
    }

    const unsub = onAuthStateChanged(auth, async (fbUser: User | null) => {
      if (fbUser) {
        const profile = await provisionAndLoadProfile(fbUser.uid).catch((err) => {
          console.error('[auth] provision failed', err);
          return null;
        });
        const fallback = fbUser.uid.replace('twitch:', '');
        setUser({
          uid: fbUser.uid,
          login: profile?.login ?? fallback,
          displayName: profile?.displayName ?? fallback,
          avatarUrl: profile?.avatarUrl ?? '',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [configured]);

  async function signOut() {
    const auth = getFirebaseAuth();
    if (auth) await fbSignOut(auth);
    router.push('/login');
  }

  return (
    <AuthCtx.Provider value={{ user, loading, configured, signOut }}>{children}</AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
