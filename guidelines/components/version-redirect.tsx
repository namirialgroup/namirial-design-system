'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Client-side redirect used for the /docs index (empty slug) in root-type
 * versioning: it takes the user to the default version. `useRouter().replace`
 * applies the `basePath` automatically (e.g. /namirial-design-system in CI),
 * so it works both locally and on GitHub Pages with static output.
 * On the page it is paired with a <meta http-equiv="refresh"> as a fallback
 * for crawlers and browsers without JS.
 */
export function VersionRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return null;
}
