'use client';

import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import type {
  ChannelConfig,
  LifetimeStats,
  SessionSummary,
  SessionCounters,
  SessionStatus,
  RecentEvent,
  ReviewEntry,
} from '@ozenmod/database';
import { paths } from '@ozenmod/database';
import { getFirebaseDb } from '@/lib/firebase-client';
import { useAuth } from '@/components/auth/AuthProvider';

export interface ChannelData {
  loading: boolean;
  config: ChannelConfig | null;
  lifetime: LifetimeStats | null;
  lastSession: SessionSummary | null;
  status: SessionStatus | null;
  counters: SessionCounters | null;
  recent: (RecentEvent & { id: string })[];
  review: (ReviewEntry & { id: string })[];
  /** True when the bot is currently online (fresh heartbeat). */
  online: boolean;
}

const EMPTY: ChannelData = {
  loading: true,
  config: null,
  lifetime: null,
  lastSession: null,
  status: null,
  counters: null,
  recent: [],
  review: [],
  online: false,
};

function toList<T>(val: Record<string, T> | null | undefined): (T & { id: string })[] {
  if (!val) return [];
  return Object.entries(val).map(([id, v]) => ({ ...(v as T), id }));
}

/**
 * Subscribes to the signed-in channel's permanent + session data in Firebase.
 * Everything is null/empty until the desktop bot writes — the UI renders real
 * empty states, never demo data.
 */
export function useChannelData(): ChannelData {
  const { user } = useAuth();
  const [data, setData] = useState<ChannelData>(EMPTY);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db || !user) {
      setData({ ...EMPTY, loading: false });
      return;
    }
    const uid = user.uid;
    const partial: Partial<ChannelData> = {};
    const emit = () =>
      setData({
        loading: false,
        config: partial.config ?? null,
        lifetime: partial.lifetime ?? null,
        lastSession: partial.lastSession ?? null,
        status: partial.status ?? null,
        counters: partial.counters ?? null,
        recent: partial.recent ?? [],
        review: partial.review ?? [],
        online: partial.status ? Date.now() - partial.status.lastHeartbeat < 120_000 : false,
      });

    const subs = [
      onValue(ref(db, paths.config(uid)), (s) => {
        partial.config = s.val();
        emit();
      }),
      onValue(ref(db, paths.lifetime(uid)), (s) => {
        partial.lifetime = s.val();
        emit();
      }),
      onValue(ref(db, paths.lastSession(uid)), (s) => {
        partial.lastSession = s.val();
        emit();
      }),
      onValue(ref(db, paths.status(uid)), (s) => {
        partial.status = s.val();
        emit();
      }),
      onValue(ref(db, paths.counters(uid)), (s) => {
        partial.counters = s.val();
        emit();
      }),
      onValue(ref(db, paths.recent(uid)), (s) => {
        partial.recent = toList<RecentEvent>(s.val()).sort((a, b) => b.t - a.t);
        emit();
      }),
      onValue(ref(db, paths.review(uid)), (s) => {
        partial.review = toList<ReviewEntry>(s.val()).sort((a, b) => b.t - a.t);
        emit();
      }),
    ];
    return () => subs.forEach((unsub) => unsub());
  }, [user]);

  return data;
}
