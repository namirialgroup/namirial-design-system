import Link from 'next/link';

const sections = [
  {
    href: '/docs/accessibility',
    title: 'Accessibility',
    description: 'How the system meets WCAG standards and inclusive-design principles.',
  },
  {
    href: '/docs/components',
    title: 'Components',
    description: 'Buttons, forms, navigation, data display and messaging building blocks.',
  },
  {
    href: '/docs/foundation',
    title: 'Foundation',
    description: 'Color, typography, radius, shadows and icons — the visual primitives.',
  },
  {
    href: '/docs/patterns',
    title: 'Patterns',
    description: 'Recommended compositions for common product flows.',
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-24 text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-fd-primary">
        Namirial
      </p>
      <h1 className="mb-4 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
        The Namirial Design System
      </h1>
      <p className="mb-8 max-w-2xl text-fd-muted-foreground md:text-lg">
        Foundations, components and patterns for building consistent Namirial
        products — all driven by the tokens in <code>namirial-theme.css</code>.
      </p>
      <div className="mb-16 flex flex-wrap justify-center gap-3">
        <Link href="/docs" className="nm-button nm-button--accent nm-button--lg">
          Explore the docs
        </Link>
        <Link
          href="/docs/components/actions/button"
          className="nm-button nm-button--secondary nm-button--lg"
        >
          Browse components
        </Link>
      </div>

      <div className="grid w-full max-w-4xl gap-4 text-left sm:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl border border-fd-border bg-fd-card p-5 transition-colors hover:bg-fd-accent"
          >
            <h2 className="mb-1 text-lg font-semibold">{s.title}</h2>
            <p className="text-sm text-fd-muted-foreground">{s.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
