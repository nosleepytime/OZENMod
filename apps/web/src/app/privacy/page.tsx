import type { Metadata } from 'next';
import { MarketingNav } from '@/components/MarketingNav';
import { MarketingFooter } from '@/components/MarketingFooter';
import { LegalBody } from '@/components/LegalBody';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What OZENMod stores (almost nothing), how long, and how to delete it.',
};

export default function PrivacyPage() {
  return (
    <>
      <MarketingNav />
      <LegalBody title="Privacy policy" updated="July 15, 2026">
        <p>
          OZENMod is built to store as little as possible. This policy explains exactly what leaves
          your computer and what does not.
        </p>

        <h2>What we do NOT store</h2>
        <ul>
          <li>
            <b>Your chat.</b> Messages are analyzed in memory on your own machine and are never
            written to our database or sent anywhere except, for genuinely ambiguous messages, to
            the AI provider you selected.
          </li>
          <li>
            <b>Long-term moderation history.</b> Warnings, active timeouts, review-queue items and
            the recent-events feed are temporary session data, deleted automatically when your
            stream ends (or when a final sanction is applied).
          </li>
        </ul>

        <h2>What we store, and why</h2>
        <ul>
          <li>
            <b>Account basics:</b> your Twitch user id, login, display name and avatar URL — to show
            you your own dashboard.
          </li>
          <li>
            <b>Your settings:</b> moderation rules, warning ladder, AI provider choice (never API
            keys) and preferences.
          </li>
          <li>
            <b>Anonymous lifetime counters:</b> totals such as messages analyzed and actions taken,
            with no message content.
          </li>
          <li>
            <b>A single last-session summary:</b> overwritten each stream, never a growing log.
          </li>
        </ul>

        <h2>API keys</h2>
        <p>
          If you bring your own AI provider, its API key is stored only on your computer, in your
          operating system&apos;s secure keychain. It is never uploaded to our database.
        </p>

        <h2>Deleting your data</h2>
        <p>
          You can delete everything at any time from the app or the dashboard (Settings → Delete all
          my data, or Disconnect Twitch). This wipes your channel and session data, revokes the
          bot&apos;s tokens and clears local secrets. The action cannot be undone.
        </p>

        <h2>Third parties</h2>
        <p>
          OZENMod talks to Twitch (to read chat and apply actions), Firebase (to store the small
          amount of data above) and the AI provider you choose. No data is sold or used for
          advertising.
        </p>
      </LegalBody>
      <MarketingFooter />
    </>
  );
}
