/** Presentation helpers shared across the dashboard. Pure, no demo data. */

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function formatTime(at: number): string {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#FCD34D,#F59E0B)',
  'linear-gradient(135deg,#F9A8D4,#EC4899)',
  'linear-gradient(135deg,#93C5FD,#3B82F6)',
  'linear-gradient(135deg,#FCA5A5,#EF4444)',
  'linear-gradient(135deg,#86EFAC,#22C55E)',
  'linear-gradient(135deg,#C4B5FD,#8B5CF6)',
  'linear-gradient(135deg,#FDBA74,#F97316)',
  'linear-gradient(135deg,#A5F3FC,#06B6D4)',
  'linear-gradient(135deg,#94A3B8,#64748B)',
  'linear-gradient(135deg,#F0ABFC,#D946EF)',
];

export function avatarGradient(login: string): string {
  let hash = 0;
  for (const ch of login) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length] as string;
}
