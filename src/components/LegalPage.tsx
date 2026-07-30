import type { ReactNode } from "react";

export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-charcoal sm:text-4xl">{title}</h1>
      {updated && <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>}
      <div className="legal mt-8 space-y-6 leading-relaxed text-muted">{children}</div>
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-charcoal">{heading}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
