import { NavLayout } from '@/components/version-nav';
import { baseOptions } from '@/lib/layout.shared';
import { getVersions } from '@/lib/versions';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <NavLayout {...baseOptions()} versions={getVersions()}>
      {children}
    </NavLayout>
  );
}
