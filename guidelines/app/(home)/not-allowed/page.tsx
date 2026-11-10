import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { defaultVersion } from '@/lib/shared';
// Static import: Next emits the file under _next/static with the basePath applied.
import notAllowedIllustration from './not-allowed.svg';
import notAllowedIllustrationDark from './not-allowed-dark.svg';

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
      {/* Decorative: the heading and copy below already convey the message. Both variants are
          rendered and toggled by the .dark class on <html>, so there is no hydration flash. */}
      <Image
        src={notAllowedIllustration}
        alt=""
        priority
        className="mb-10 h-auto w-40 md:w-56 dark:hidden"
      />
      <Image
        src={notAllowedIllustrationDark}
        alt=""
        priority
        className="mb-10 hidden h-auto w-40 md:w-56 dark:block"
      />
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-fd-primary">
        Error 403
      </p>
      <h1 className="mb-8 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
        Internal resource
      </h1>
      <p className="mb-6 max-w-xl text-fd-muted-foreground md:text-lg">
        Access to this version of the Namirial Design System is restricted to internal corporate networks.
      </p>
      <p className="mb-6 max-w-xl text-fd-muted-foreground md:text-lg">
        If you belong to the organization, ensure you are connected to the company network and reload the page.
      </p>
      <div className="flex flex-wrap justify-center">
        <Link href="/" className="nm-button nm-button--secondary nm-button--lg">
          Back to home
        </Link>
      </div>
    </main>
  );
}
