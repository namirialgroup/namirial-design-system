import { getDocsTree, getVersions } from '@/lib/versions';
import { DocsNavLayout, NavLayout } from '@/components/version-nav';
import { baseOptions, docsOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  const tree = getDocsTree();
  const options = docsOptions();
  return (
    // Global navbar: logo and main links on the left; version switcher, search, theme and GitHub on the right.
    // On mobile it is replaced by the DocsLayout header (see app/global.css).
    <NavLayout {...baseOptions()} versions={getVersions()}>
      <DocsNavLayout
        tree={tree}
        {...options}
        // Versions and sections are already in the global navbar: no tab row in the DocsLayout header.
        tabs={false}
        nav={{
          ...options.nav,
          mode: 'top',
          enabled: true,
        } as any}
      >
        {children}
      </DocsNavLayout>
    </NavLayout>
  );
}
