import type { Metadata } from 'next';
import { ModerationClient } from './ModerationClient';

export const metadata: Metadata = { title: 'Moderation' };

export default function ModerationPage() {
  return <ModerationClient />;
}
