import type { Metadata } from 'next';
import { AiClient } from './AiClient';

export const metadata: Metadata = { title: 'AI & Providers' };

export default function AiProvidersPage() {
  return <AiClient />;
}
