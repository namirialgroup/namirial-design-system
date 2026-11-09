import { getPageImage, getPageMarkdownUrl, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/notebook/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { appName, defaultDocsRoute, gitConfig } from '@/lib/shared';
import { Breadcrumb } from '@/components/breadcrumb';
import { VersionRedirect } from '@/components/version-redirect';
import { getVersions } from '@/lib/versions';

// basePath applied in production (GitHub Pages); empty locally.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

// Root-type versioning: /docs has no page of its own, the content lives under
// /docs/v1 and /docs/v2. We redirect the index to the default version.
function isDocsIndex(slug?: string[]): boolean {
  return !slug || slug.length === 0;
}

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;

  if (isDocsIndex(params.slug)) {
    return (
      <>
        {/* Fallback for crawlers / no-JS: the meta refresh needs the basePath explicitly. */}
        <meta httpEquiv="refresh" content={`0; url=${basePath}${defaultDocsRoute}`} />
        <VersionRedirect to={defaultDocsRoute} />
      </>
    );
  }

  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  // Version home (/docs/v1, /docs/v2): marked to hide the sidebar (see app/global.css).
  const isVersionHome = getVersions().some((version) => version.url === page.url);

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      data-version-home={isVersionHome || undefined}
      // Selects the version's tokens (see postcss/docs-css.mjs).
      data-docs-version={page.slugs[0]}
    >
      <Breadcrumb tree={source.getPageTree()} />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  // Adds the /docs index (empty slug) so the static export generates the redirect
  // HTML; the other params come from the version pages.
  return [{ slug: [] as string[] }, ...source.generateParams()];
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;

  if (isDocsIndex(params.slug)) {
    return { title: appName };
  }

  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
