import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

// `output: 'export'` richiede una search statica: `staticGET` genera l'indice
// Orama a build-time, interrogato lato client (vedi RootProvider in app/layout.tsx).
export const revalidate = false;

export const { staticGET: GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
});
