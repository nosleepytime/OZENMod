import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ExternalLink } from 'lucide-react';
import { MarketingNav } from '@/components/MarketingNav';
import { MarketingFooter } from '@/components/MarketingFooter';
import { DOCS_URL, GITHUB_URL } from '@ozenmod/shared';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'OZENMod product and engineering documentation.',
};

const DOCS = [
  {
    name: 'Product design',
    file: 'PRODUCT.md',
    desc: 'Vision, tiers, every page and view, features, UX and user flows.',
  },
  {
    name: 'Architecture',
    file: 'ARCHITECTURE.md',
    desc: 'Topology, monorepo layout, Twitch integration, updates, CI/CD.',
  },
  {
    name: 'Database',
    file: 'DATABASE.md',
    desc: 'Firebase schema, session cleanup, read/write optimization.',
  },
  {
    name: 'Moderation',
    file: 'MODERATION.md',
    desc: 'Local-first pipeline, AI escalation, decisions, warning ladder, AI Assistant.',
  },
  {
    name: 'AI providers',
    file: 'AI-PROVIDERS.md',
    desc: 'Provider interface, Pollinations default, bring-your-own keys.',
  },
  {
    name: 'Security',
    file: 'SECURITY.md',
    desc: 'OAuth, token storage, database rules, hardening, privacy.',
  },
  { name: 'Roadmap', file: 'ROADMAP.md', desc: 'The mandatory development order and milestones.' },
];

export default function DocsPage() {
  return (
    <>
      <MarketingNav />
      <main className="m-container" style={{ padding: '56px 32px 80px' }}>
        <div className="section-head" style={{ maxWidth: 700 }}>
          <span className="section-kicker">Documentation</span>
          <h1 className="h-display" style={{ fontSize: 40 }}>
            Everything, documented
          </h1>
          <p className="lead">
            The full product and engineering design lives in the repository. Each document renders
            on GitHub with diagrams.
          </p>
        </div>
        <div className="features-grid" style={{ marginBottom: 24 }}>
          {DOCS.map((d) => (
            <a
              className="card feature-card"
              key={d.file}
              href={`${DOCS_URL}/${d.file}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="feature-ic">
                <BookOpen className="ic" />
              </span>
              <b>
                {d.name}{' '}
                <ExternalLink
                  className="ic ic-sm"
                  style={{ display: 'inline', verticalAlign: 'middle' }}
                />
              </b>
              <p>{d.desc}</p>
            </a>
          ))}
        </div>
        <div className="row" style={{ gap: 12 }}>
          <a className="btn btn-primary" href={DOCS_URL} target="_blank" rel="noreferrer">
            Browse docs on GitHub
          </a>
          <a className="btn btn-outline" href={GITHUB_URL} target="_blank" rel="noreferrer">
            View the repository
          </a>
          <Link className="btn btn-ghost" href="/download">
            Download the app
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
