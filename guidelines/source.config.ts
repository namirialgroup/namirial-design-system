import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';

// In CI viene valorizzato da GitHub Pages (es. "/namirial-design-system"); in locale resta "".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * I <img> nei file MDX usano path assoluti (es. /img/foo.png). Next.js NON applica
 * il basePath ai tag <img> raw, e in MDX i tag intrinseci letterali non passano dalla
 * mappa `components`. Riscriviamo quindi il `src` in fase di compilazione (hast),
 * così in produzione (GitHub Pages, sotto /namirial-design-system) le immagini
 * risolvono correttamente. Copre sia gli <img> letterali sia le immagini markdown.
 */
function rehypeBasePathImages() {
  if (!basePath) return () => {};

  const prefix = (src: unknown): unknown =>
    typeof src === 'string' && src.startsWith('/') && !src.startsWith(`${basePath}/`)
      ? `${basePath}${src}`
      : src;

  const visit = (node: any) => {
    // Immagini markdown / HTML → nodi hast `element` (tagName + properties)
    if (node?.type === 'element' && node.tagName === 'img' && node.properties) {
      node.properties.src = prefix(node.properties.src);
    }
    // <img> letterali in MDX → nodi mdxJsx (name + attributes)
    if (
      (node?.type === 'mdxJsxTextElement' || node?.type === 'mdxJsxFlowElement') &&
      node.name === 'img' &&
      Array.isArray(node.attributes)
    ) {
      for (const attr of node.attributes) {
        if (attr?.type === 'mdxJsxAttribute' && attr.name === 'src') {
          attr.value = prefix(attr.value);
        }
      }
    }
    if (Array.isArray(node?.children)) node.children.forEach(visit);
  };

  return (tree: any) => visit(tree);
}

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // Estende i rehype plugin di default di fumadocs con la riscrittura del basePath sulle immagini.
    rehypePlugins: (v) => [...v, rehypeBasePathImages],
  },
});
