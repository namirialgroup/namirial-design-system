import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
// import { getLayoutTabs } from 'fumadocs-ui/layouts/shared';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  const tree = source.getPageTree();
  const options = baseOptions(); 
  return (
    <HomeLayout {...options}>
      <DocsLayout
        // tree={tree}
        tree={source.getPageTree()}
        tabs={[]}
        {...options}
        tabMode="navbar" // This instructs Fumadocs to render the global desktop navbar above the sidebar.
        // Sidebar Configuration
        nav={{
          ...options.nav,
          mode: 'top',
          enabled: true,
        } as any}
      >
        {children}
      </DocsLayout>
    </HomeLayout>
  );
}
