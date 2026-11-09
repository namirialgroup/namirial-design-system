import type { Folder, Item, Node, Root } from 'fumadocs-core/page-tree';
import { source } from './source';
import { docsRoute } from './shared';

export interface DocsVersion {
  /** URL segment of the version, e.g. "v1". */
  slug: string;
  /** Label shown in the switcher (`title` from meta.json). */
  title: string;
  /** Landing page of the version. */
  url: string;
  /** All URLs of the version: used to stay on the same page when switching versions. */
  pages: string[];
}

function collectUrls(folder: Folder, out: string[] = []): string[] {
  if (folder.index) out.push(folder.index.url);
  for (const child of folder.children) {
    if (child.type === 'page' && !child.external) out.push(child.url);
    if (child.type === 'folder') collectUrls(child, out);
  }
  return out;
}

// Root-type versioning: versions are the folders with `root: "version"` in content/docs.
const isVersionFolder = (node: Node): node is Folder => node.type === 'folder' && node.root === 'version';

export function getVersions(): DocsVersion[] {
  return source
    .getPageTree()
    .children.filter(isVersionFolder)
    .map((folder) => {
      const pages = collectUrls(folder);
      const url = pages[0] ?? docsRoute;
      const slug = url.slice(docsRoute.length + 1).split('/')[0];

      return { slug, title: typeof folder.name === 'string' ? folder.name : slug, url, pages };
    });
}

/**
 * Page tree for the DocsLayout. In version folders the index page (/docs/<version>) is the
 * first child, so the version home sidebar would repeat it next to "Home".
 * We move it to `folder.index`: the sidebar shows only the folder's children, while Fumadocs
 * keeps using `folder.index` to detect the active page and for previous/next links.
 */
export function getDocsTree(): Root {
  const tree = source.getPageTree();
  // Depth of /docs/<version>, e.g. ['', 'docs', 'v1'].
  const indexDepth = docsRoute.split('/').length + 1;

  return {
    ...tree,
    children: tree.children.map((node) => {
      if (!isVersionFolder(node) || node.index) return node;

      const index = node.children.find(
        (child): child is Item => child.type === 'page' && child.url.split('/').length === indexDepth,
      );
      if (!index) return node;

      return { ...node, index, children: node.children.filter((child) => child !== index) };
    }),
  };
}
