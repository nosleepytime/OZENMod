import type { Metadata } from 'next';
import { FiltersClient } from './FiltersClient';

export const metadata: Metadata = { title: 'Filters' };

export default function FiltersPage() {
  return <FiltersClient />;
}
