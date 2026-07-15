/** RTDB path builders — one place so the schema layout is not duplicated. */

export const paths = {
  channel: (uid: string) => `channels/${uid}`,
  profile: (uid: string) => `channels/${uid}/profile`,
  config: (uid: string) => `channels/${uid}/config`,
  lifetime: (uid: string) => `channels/${uid}/stats/lifetime`,
  lastSession: (uid: string) => `channels/${uid}/lastSession`,

  session: (uid: string) => `sessions/${uid}`,
  status: (uid: string) => `sessions/${uid}/status`,
  counters: (uid: string) => `sessions/${uid}/counters`,
  warnings: (uid: string) => `sessions/${uid}/warnings`,
  warning: (uid: string, twitchUserId: string) => `sessions/${uid}/warnings/${twitchUserId}`,
  review: (uid: string) => `sessions/${uid}/review`,
  reviewItem: (uid: string, id: string) => `sessions/${uid}/review/${id}`,
  recent: (uid: string) => `sessions/${uid}/recent`,
  commands: (uid: string) => `sessions/${uid}/commands`,
  command: (uid: string, id: string) => `sessions/${uid}/commands/${id}`,
} as const;
