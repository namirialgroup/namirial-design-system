import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { VersionedNavLinks } from '@/components/version-nav';
import { appName, gitConfig } from './shared';

// Top-level entries. With root-type versioning they live under /docs/<version>/<section>.
const mainSections = [
  { text: 'Accessibility', section: 'accessibility' },
  { text: 'Components', section: 'components' },
  { text: 'Foundation', section: 'foundation' },
  { text: 'Patterns', section: 'patterns' },
];

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: appName,
      enabled: true,
      // transparentMode: 'top',
    },
    // Links follow the current version (they need pathname and versions, so they are client-side).
    links: [
      { type: 'custom', on: 'nav', children: <VersionedNavLinks items={mainSections} /> },
      { type: 'custom', on: 'menu', children: <VersionedNavLinks items={mainSections} variant="menu" /> },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}

/** DocsLayout options: the main links live in the mobile drawer, styled as sidebar items. */
export function docsOptions(): BaseLayoutProps {
  return {
    ...baseOptions(),
    links: [{ type: 'custom', on: 'menu', children: <VersionedNavLinks items={mainSections} variant="sidebar" /> }],
  };
}
