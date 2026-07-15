export function LegalBody({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="m-container legal" style={{ padding: '56px 32px 80px', maxWidth: 820 }}>
      <span className="section-kicker">Legal</span>
      <h1 className="h-display" style={{ fontSize: 38, marginTop: 8 }}>
        {title}
      </h1>
      <p className="card-sub" style={{ marginTop: 8, marginBottom: 28 }}>
        Last updated: {updated}
      </p>
      <div className="legal-content">{children}</div>
    </main>
  );
}
