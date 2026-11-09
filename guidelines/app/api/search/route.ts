import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

// `output: 'export'` requires a static search: `staticGET` generates the Orama index
// at build time, queried on the client (see RootProvider in app/layout.tsx).
export const revalidate = false;

export const { staticGET: GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
});
