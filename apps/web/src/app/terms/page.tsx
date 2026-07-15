import type { Metadata } from 'next';
import { MarketingNav } from '@/components/MarketingNav';
import { MarketingFooter } from '@/components/MarketingFooter';
import { LegalBody } from '@/components/LegalBody';

export const metadata: Metadata = {
  title: 'Terms of use',
  description: 'The terms under which OZENMod is provided — open source, as-is, MIT licensed.',
};

export default function TermsPage() {
  return (
    <>
      <MarketingNav />
      <LegalBody title="Terms of use" updated="July 15, 2026">
        <p>
          OZENMod is free, open-source software provided under the MIT License. By using the app,
          the website or the dashboard, you agree to the following.
        </p>

        <h2>The service</h2>
        <ul>
          <li>
            OZENMod helps you moderate your own Twitch channel. You are responsible for the
            moderation decisions applied to your channel, including any you configure the bot to
            make automatically.
          </li>
          <li>
            You must comply with Twitch&apos;s Terms of Service and Community Guidelines when using
            OZENMod.
          </li>
          <li>
            The free tier runs on your own computer and on free-plan third-party services;
            continuity of those services is not guaranteed.
          </li>
        </ul>

        <h2>No warranty</h2>
        <p>
          The software is provided “as is”, without warranty of any kind. Automated moderation is
          imperfect: it may occasionally act on a message it should not, or miss one it should
          catch. You remain in control — every action is explained, reversible, and configurable.
        </p>

        <h2>Acceptable use</h2>
        <ul>
          <li>
            Do not use OZENMod to harass, or to moderate a channel you are not authorized to
            moderate.
          </li>
          <li>Do not attempt to abuse third-party free tiers beyond their intended use.</li>
        </ul>

        <h2>Open source</h2>
        <p>
          The source code is available on GitHub under the MIT License. You are free to use, modify
          and distribute it under those terms.
        </p>

        <h2>Changes</h2>
        <p>
          These terms may change as the project evolves. Material changes will be noted in the
          project changelog.
        </p>
      </LegalBody>
      <MarketingFooter />
    </>
  );
}
