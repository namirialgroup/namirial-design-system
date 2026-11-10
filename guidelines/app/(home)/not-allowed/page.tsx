import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { defaultVersion, docsRoute } from '@/lib/shared';

// Custom 403 landing, outside the docs versioning. With static export and no trailingSlash
// this route is emitted as out/not-allowed.html, so it can be targeted as an error page.
export const metadata: Metadata = {
  title: 'Access not allowed',
  description: 'You do not have permission to view this version of the Namirial Design System.',
  robots: { index: false, follow: false },
};

// Same background setup as the home page (see app/(home)/page.tsx).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const bgSuffix = defaultVersion === 'v1' ? '' : `-${defaultVersion}`;
const bgDir = `${basePath}/img/${defaultVersion}`;
const bgVars = {
  '--home-bg-light': `url(${bgDir}/background-light${bgSuffix}.svg)`,
  '--home-bg-dark': `url(${bgDir}/background-dark${bgSuffix}.svg)`,
} as CSSProperties;

export default function NotAllowedPage() {
  return (
    <main
      className="with-bg flex flex-1 flex-col items-center px-4 py-24 text-center"
      style={bgVars}
      data-docs-version={defaultVersion}
    >
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-fd-primary">
        Error 403
      </p>
      <h1 className="mb-4 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
        Access not allowed
      </h1>
      <p className="mb-8 max-w-2xl text-fd-muted-foreground md:text-lg">
        You do not have permission to view this version of the Namirial Design System.
        If you think you should have access, contact the Design System team.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href={`${docsRoute}/v1`} className="nm-button nm-button--accent nm-button--lg">
          Go to the v1 docs
        </Link>
        <Link href="/" className="nm-button nm-button--secondary nm-button--lg">
          Back to home
        </Link>
      </div>
    </main>
  );
}
