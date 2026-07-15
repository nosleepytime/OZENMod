'use client';

import { useCallback } from 'react';
import { ref, update } from 'firebase/database';
import { defaultConfig, paths, type ChannelConfig } from '@ozenmod/database';
import { getFirebaseDb } from '@/lib/firebase-client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useChannelData } from '@/lib/useChannelData';

export interface UseConfig {
  config: ChannelConfig;
  loading: boolean;
  /** Persist deep field updates, e.g. patch({ 'moderation/sensitivity': 'strict' }). */
  patch: (fields: Record<string, unknown>) => Promise<void>;
  ready: boolean;
}

/**
 * Reads the signed-in channel's real config from Firebase (defaults until the
 * first save) and persists changes. This is the real config editor backing —
 * no demo data.
 */
export function useConfig(): UseConfig {
  const { user } = useAuth();
  const { config, loading } = useChannelData();
  const effective = config ?? defaultConfig();

  const patch = useCallback(
    async (fields: Record<string, unknown>) => {
      const db = getFirebaseDb();
      if (!db || !user) return;
      await update(ref(db, paths.config(user.uid)), { ...fields, updatedAt: Date.now() });
    },
    [user],
  );

  return { config: effective, loading, patch, ready: Boolean(user && getFirebaseDb()) };
}
