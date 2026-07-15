import type { ModerationEvent } from '@ozenmod/shared';
import type { RecentEvent } from '@ozenmod/database';

const ACTIONS: ModerationEvent['action'][] = [
  'allow',
  'ignore',
  'delete',
  'warn',
  'timeout',
  'ban',
  'review',
];

/** Map a stored RTDB recent event to the ModerationEvent shape the chips use. */
export function recentToEvent(r: RecentEvent & { id: string }): ModerationEvent {
  const action = (
    ACTIONS.includes(r.action as ModerationEvent['action']) ? r.action : 'delete'
  ) as ModerationEvent['action'];
  return {
    id: r.id,
    at: r.t,
    userLogin: r.user,
    userDisplay: r.user,
    category: 'none',
    categoryLabel: r.category || '—',
    action,
    actionLabel: r.action,
    source: r.source,
    reason: r.reason,
    strike: r.strike,
  };
}
