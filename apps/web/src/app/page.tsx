import Link from 'next/link';
import {
  Sparkles,
  Zap,
  Eye,
  Scale,
  Shield,
  KeyRound,
  Check,
  Download,
  Clock,
  Ban,
  Cpu,
  Twitch,
  ChevronDown,
} from 'lucide-react';
import { MarketingNav } from '@/components/MarketingNav';
import { MarketingFooter } from '@/components/MarketingFooter';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Context-aware AI',
    body: 'Conversation history, targets, irony and intent — ambiguous messages get real judgement, with a verdict and a confidence score.',
  },
  {
    icon: Zap,
    title: 'Local-first speed',
    body: 'Spam, flood, links, evasion and obvious toxicity are decided on your machine in under 5 ms. The AI is the exception, not the rule.',
  },
  {
    icon: Eye,
    title: 'Explainable decisions',
    body: 'Allow, delete, warn, timeout, ban or human review — every action is logged with a reason you and your mods can read.',
  },
  {
    icon: Scale,
    title: 'Fair warning ladder',
    body: 'Strikes before sanctions, escalating timeouts if you prefer, exemptions for mods and VIPs — and instant action on severe content.',
  },
  {
    icon: Shield,
    title: 'Evasion-proof filters',
    body: 'Leetspeak, homoglyphs, zero-width characters, s p a c i n g — normalization folds the tricks before rules run.',
  },
  {
    icon: KeyRound,
    title: 'Your keys, your control',
    body: 'Pollinations free tier by default. Plug OpenAI, Anthropic, Gemini or a local Ollama — keys never leave your computer.',
  },
];

const STEPS = [
  {
    title: 'Download & connect',
    body: 'Install the app (Windows/macOS) and link Twitch with a device code — your account or a dedicated bot account.',
  },
  {
    title: 'Start the bot before you stream',
    body: 'Open OZENMod, press Start — or let it auto-start when your stream goes live. Everything runs on your computer.',
  },
  {
    title: 'Stream worry-free',
    body: 'Watch decisions land in the live feed with reasons. Tune rules from the app or the web dashboard, even mid-stream.',
  },
];

const FAQS = [
  {
    q: 'Is it really 100% free?',
    a: "Yes. The bot runs on your computer, the dashboard runs on free hosting, data lives on Firebase's free plan and the default AI (Pollinations) needs no account. There is no paid feature today — a future premium tier will only add optional cloud hosting.",
  },
  {
    q: 'Do you store my chat?',
    a: 'No. Messages are analyzed in memory on your machine and never persisted. Warnings and session stats are temporary and deleted automatically when your stream ends.',
  },
  {
    q: 'What if the AI gets it wrong?',
    a: 'Uncertain cases go to a human-review queue instead of a sanction, every action is explained and reversible, and “mark as false positive” tunes your channel’s thresholds.',
  },
  {
    q: 'Does it replace my human mods?',
    a: 'It works with them. Mods and VIPs are exempt by default, the review queue is built for them, and the dashboard gives them the same visibility you have.',
  },
];

export default function LandingPage() {
  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <header className="hero">
        <div className="m-container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow" style={{ alignSelf: 'flex-start' }}>
              <Sparkles className="ic ic-sm" /> Open source · Free forever tier
            </span>
            <h1 className="h-display">
              Moderation that actually <span className="grad">understands</span> your chat.
            </h1>
            <p className="lead">
              OZENMod watches your Twitch chat in real time and reasons about context — not just
              keywords. It deletes, warns, times out or escalates to you, and explains every single
              decision.
            </p>
            <div className="cta-row">
              <Link className="btn btn-primary btn-lg" href="/download">
                <Download className="ic" /> Download for Windows
              </Link>
              <Link className="btn btn-ghost btn-lg" href="/download">
                Download for macOS
              </Link>
            </div>
            <div className="trust-row">
              <span className="row">
                <Check className="ic ic-sm" style={{ color: 'var(--good)' }} /> No subscription
              </span>
              <span className="row">
                <Check className="ic ic-sm" style={{ color: 'var(--good)' }} /> Runs on your PC
              </span>
              <span className="row">
                <Check className="ic ic-sm" style={{ color: 'var(--good)' }} /> MIT licensed
              </span>
              <span className="row">
                <Check className="ic ic-sm" style={{ color: 'var(--good)' }} /> Your chat is never
                stored
              </span>
            </div>
          </div>

          <div className="preview-wrap">
            <div className="preview-glow" />
            <div className="card preview">
              <div
                className="row"
                style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}
              >
                <span className="chip chip-good">
                  <span className="dot pulse" /> Protecting #pixelforge
                </span>
                <span className="chip">
                  <Clock className="ic ic-sm" /> 02:14:36
                </span>
                <span className="grow" />
                <span className="chip chip-accent">
                  <Sparkles className="ic ic-sm" /> AI: Pollinations
                </span>
              </div>
              <div className="feed">
                <div className="feed-item calm">
                  <div className="feed-body">
                    <div className="feed-line">
                      <span className="feed-user" style={{ color: '#6BD3FB' }}>
                        mia_kplays
                      </span>
                      <span className="feed-msg">that boss fight was insane, clip it!!</span>
                      <span className="feed-time">22:13:41</span>
                    </div>
                  </div>
                </div>
                <div className="feed-item">
                  <div className="feed-body">
                    <div className="feed-line">
                      <span className="feed-user" style={{ color: '#F9A8D4' }}>
                        xX_rager_Xx
                      </span>
                      <span className="feed-msg struck">
                        you&apos;re trash mia go back to fortnite
                      </span>
                      <span className="feed-time">22:13:58</span>
                    </div>
                    <div className="feed-reason">
                      <span className="chip chip-warn">
                        <Eye className="ic ic-sm" /> Warning 2/3
                      </span>{' '}
                      Targeted insult at another chatter
                    </div>
                  </div>
                </div>
                <div className="feed-item">
                  <div className="feed-body">
                    <div className="feed-line">
                      <span className="feed-user" style={{ color: '#FCD34D' }}>
                        grifter_joe
                      </span>
                      <span className="feed-msg struck">
                        FREE BITS at b1ts-4u.top just log in with twitch
                      </span>
                      <span className="feed-time">22:14:31</span>
                    </div>
                    <div className="feed-reason">
                      <span className="chip chip-danger">
                        <Ban className="ic ic-sm" /> Deleted · Timeout 10m
                      </span>{' '}
                      Phishing link (credential scam)
                    </div>
                  </div>
                </div>
                <div className="feed-item calm" style={{ borderBottom: 0 }}>
                  <div className="feed-body">
                    <div className="feed-line">
                      <span className="feed-user" style={{ color: '#86EFAC' }}>
                        new_viewer42
                      </span>
                      <span className="feed-msg">lol the bot is fast</span>
                      <span className="feed-time">22:14:39</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="float-card">
              <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                <Sparkles className="ic" style={{ color: 'var(--accent-2)' }} />
                <b>Why this decision?</b>
              </div>
              <span className="dim" style={{ color: 'var(--text-2)' }}>
                “Second targeted insult this stream after a prior warning — strike 2/3, message
                removed.”
              </span>
              <div className="row" style={{ marginTop: 10, gap: 6 }}>
                <span className="chip">confidence 0.83</span>
                <span className="chip">source: AI</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* STATS STRIP */}
      <section className="strip">
        <div className="strip-grid">
          <div className="strip-item">
            <b>&lt; 5 ms</b>
            <span>local decisions</span>
          </div>
          <div className="strip-item">
            <b>≥ 95%</b>
            <span>handled without AI calls</span>
          </div>
          <div className="strip-item">
            <b>$0</b>
            <span>to run the free tier</span>
          </div>
          <div className="strip-item">
            <b>100%</b>
            <span>open source (MIT)</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="m-container">
          <div className="section-head">
            <span className="section-kicker">Why OZENMod</span>
            <h2 className="section-title">A moderator that reasons, not a blacklist</h2>
            <p className="lead" style={{ fontSize: 15 }}>
              Blacklists punish the innocent and miss the clever. OZENMod normalizes evasion tricks,
              scores context locally, and asks an AI only when a message is genuinely ambiguous.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div className="card feature-card" key={title}>
                <span className="feature-ic">
                  <Icon className="ic" />
                </span>
                <b>{title}</b>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" id="how" style={{ paddingTop: 10 }}>
        <div className="m-container">
          <div className="section-head">
            <span className="section-kicker">How it works</span>
            <h2 className="section-title">Protected in three steps</h2>
          </div>
          <div className="steps-grid">
            {STEPS.map(({ title, body }, i) => (
              <div className="card feature-card" key={title}>
                <span className="step-num">{i + 1}</span>
                <b>{title}</b>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROVIDERS */}
      <section className="section" id="providers" style={{ paddingTop: 10 }}>
        <div className="m-container">
          <div className="section-head">
            <span className="section-kicker">AI providers</span>
            <h2 className="section-title">Free by default, modular by design</h2>
            <p className="lead" style={{ fontSize: 15 }}>
              The free tier ships with Pollinations — no account, no API key. Prefer another brain?
              Swap providers in one click.
            </p>
          </div>
          <div className="providers-band">
            <span className="provider-pill active">
              <Sparkles className="ic" style={{ color: 'var(--accent-2)' }} /> Pollinations{' '}
              <small>· default · free · no key</small>
            </span>
            <span className="provider-pill">
              OpenAI <small>· your key</small>
            </span>
            <span className="provider-pill">
              Anthropic <small>· your key</small>
            </span>
            <span className="provider-pill">
              Google Gemini <small>· your key</small>
            </span>
            <span className="provider-pill">
              <Cpu className="ic" style={{ color: 'var(--text-3)' }} /> Ollama{' '}
              <small>· local · offline</small>
            </span>
            <span className="provider-pill">
              Custom endpoint <small>· OpenAI-compatible</small>
            </span>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" style={{ paddingTop: 10 }}>
        <div className="m-container">
          <div className="section-head">
            <span className="section-kicker">Pricing</span>
            <h2 className="section-title">Free means free</h2>
          </div>
          <div className="tiers-grid">
            <div className="card card-pad" style={{ borderColor: 'rgba(124,92,255,.4)' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <b style={{ fontSize: 16 }}>Free</b>
                <span className="chip chip-good">
                  <Check className="ic ic-sm" /> Available at launch
                </span>
              </div>
              <div className="tier-price" style={{ margin: '10px 0 14px' }}>
                $0 <small>forever</small>
              </div>
              <div className="tier-list">
                {[
                  'Full AI moderation — every feature, no limits on rules',
                  'Desktop app for Windows & macOS runs the bot during your stream',
                  'Web dashboard: stats, history, remote configuration',
                  'Pollinations AI included · bring your own provider anytime',
                  'Community support, open source forever',
                ].map((line) => (
                  <span className="row" key={line}>
                    <Check className="ic" />
                    {line}
                  </span>
                ))}
              </div>
              <Link className="btn btn-primary" style={{ marginTop: 18 }} href="/download">
                <Download className="ic" /> Download the app
              </Link>
            </div>
            <div className="card card-pad" style={{ opacity: 0.85 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <b style={{ fontSize: 16 }}>Premium</b>
                <span className="chip">
                  <Clock className="ic ic-sm" /> Planned — not available yet
                </span>
              </div>
              <div className="tier-price" style={{ margin: '10px 0 14px' }}>
                Later <small>· optional</small>
              </div>
              <div className="tier-list">
                {[
                  'Hosted bot — moderates 24/7 without the desktop app',
                  'Same engine, same rules, zero setup on stream day',
                  'The free tier stays complete — premium only adds hosting',
                ].map((line) => (
                  <span className="row" key={line}>
                    <Check className="ic" style={{ color: 'var(--text-3)' }} />
                    {line}
                  </span>
                ))}
              </div>
              <a className="btn btn-ghost" style={{ marginTop: 18 }} href="#">
                Get notified
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq" style={{ paddingTop: 10 }}>
        <div className="m-container">
          <div className="section-head">
            <span className="section-kicker">FAQ</span>
            <h2 className="section-title">Questions, answered</h2>
          </div>
          <div className="faq-list">
            {FAQS.map(({ q, a }) => (
              <div className="card faq-item" key={q}>
                <div className="faq-q">
                  {q} <ChevronDown className="ic" style={{ color: 'var(--text-3)' }} />
                </div>
                <p className="faq-a">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band">
        <div
          className="m-container"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}
        >
          <h2 className="section-title" style={{ fontSize: 36 }}>
            Protect your next stream.
          </h2>
          <p className="lead">Five minutes from download to a chat that moderates itself.</p>
          <div className="cta-row">
            <Link className="btn btn-primary btn-lg" href="/download">
              <Download className="ic" /> Download OZENMod
            </Link>
            <Link className="btn btn-twitch btn-lg" href="/login">
              <Twitch className="ic ic-fill" fill="currentColor" strokeWidth={0} /> Sign in with
              Twitch
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
