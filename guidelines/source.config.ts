import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';

// Set by GitHub Pages in CI (e.g. "/namirial-design-system"); stays "" locally.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * <img> tags in MDX files use absolute paths (e.g. /img/v1/foo.png). Next.js does NOT apply
 * the basePath to raw <img> tags, and in MDX literal intrinsic tags do not go through the
 * `components` map. So we rewrite `src` at compile time (hast), so that in production
 * (GitHub Pages, under /namirial-design-system) images resolve correctly. Covers both
 * literal <img> tags and markdown images.
 */
function rehypeBasePathImages() {
  if (!basePath) return () => {};

  const prefix = (src: unknown): unknown =>
    typeof src === 'string' && src.startsWith('/') && !src.startsWith(`${basePath}/`)
      ? `${basePath}${src}`
      : src;

  const visit = (node: any) => {
    // Markdown / HTML images → hast `element` nodes (tagName + properties)
    if (node?.type === 'element' && node.tagName === 'img' && node.properties) {
      node.properties.src = prefix(node.properties.src);
    }
    // Literal <img> in MDX → mdxJsx nodes (name + attributes)
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
    // Extends fumadocs' default rehype plugins with the basePath rewrite for images.
    rehypePlugins: (v) => [...v, rehypeBasePathImages],
  },
});
