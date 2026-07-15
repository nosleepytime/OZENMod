import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const inter = localFont({
  src: '../fonts/Inter-latin.woff2',
  variable: '--font-inter',
  display: 'swap',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: {
    default: 'OZENMod — AI moderation for Twitch',
    template: '%s — OZENMod',
  },
  description:
    'AI-powered, context-aware moderation for Twitch — free to run, open source, explainable. The bot runs on your computer and understands your chat instead of matching a blacklist.',
  applicationName: 'OZENMod',
  metadataBase: new URL('https://ozenmod.app'),
  openGraph: {
    title: 'OZENMod — AI moderation for Twitch',
    description:
      'Context-aware moderation that runs on your computer. Free, open source, explainable.',
    type: 'website',
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
