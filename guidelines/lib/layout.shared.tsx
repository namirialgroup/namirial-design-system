import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: appName,
      enabled: true,
      // transparentMode: 'top',
    },
    links: [
      { text: 'Accessibility', url: '/docs/accessibility' },
      { text: 'Components', url: '/docs/components' },
      { text: 'Foundation', url: '/docs/foundation' },
      { text: 'Patterns', url: '/docs/patterns' },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
