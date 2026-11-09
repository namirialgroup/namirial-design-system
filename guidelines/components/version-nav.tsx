'use client';

import { HomeLayout, type HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import { DocsLayout, type DocsLayoutProps } from 'fumadocs-ui/layouts/notebook';
import {
  FullSearchTrigger,
  SearchTrigger,
  type FullSearchTriggerProps,
  type SearchTriggerProps,
} from 'fumadocs-ui/layouts/shared/slots/search-trigger';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { Check, ChevronsUpDown, House } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, use, useState } from 'react';
import { cn } from '@/lib/cn';
import { defaultVersion, docsRoute } from '@/lib/shared';
import type { DocsVersion } from '@/lib/versions';

const VersionsContext = createContext<DocsVersion[]>([]);

const versionBase = (slug: string) => `${docsRoute}/${slug}`;

function isWithin(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Version of the current page; outside /docs/<version> it falls back to the default version. */
function useCurrentVersion() {
  const versions = use(VersionsContext);
  const pathname = usePathname().replace(/(.)\/$/, '$1');
  const active = versions.find((version) => isWithin(pathname, versionBase(version.slug)));
  const current = active ?? versions.find((version) => version.slug === defaultVersion) ?? versions[0];

  return { versions, pathname, current, active };
}

/**
 * HomeLayout with the version switcher to the left of the search.
 * Fumadocs' native switcher (SidebarTabsDropdown) depends on DocsLayout contexts and cannot
 * live in the HomeLayout navbar: we hook it into the `searchTrigger` slots (`full` on desktop,
 * `sm` on mobile), leaving the default search untouched.
 */
export function NavLayout({ versions, ...props }: HomeLayoutProps & { versions: DocsVersion[] }) {
  return (
    <VersionsContext value={versions}>
      <HomeLayout
        {...props}
        slots={{
          ...props.slots,
          searchTrigger: { full: SearchWithVersionSwitcher, sm: SmallSearchWithVersionSwitcher },
        }}
      />
    </VersionsContext>
  );
}

/**
 * DocsLayout with the version switcher next to the search in its header, which replaces the
 * global navbar on mobile. Must be used inside <NavLayout>, which provides the versions.
 */
export function DocsNavLayout(props: DocsLayoutProps) {
  return (
    <DocsLayout
      {...props}
      slots={{
        ...props.slots,
        searchTrigger: { full: FullSearchTrigger, sm: SmallSearchWithVersionSwitcher },
      }}
    />
  );
}

function SearchWithVersionSwitcher(props: FullSearchTriggerProps) {
  return (
    <>
      <VersionSwitcher />
      <FullSearchTrigger {...props} />
    </>
  );
}

function SmallSearchWithVersionSwitcher(props: SearchTriggerProps) {
  return (
    <>
      <VersionSwitcher />
      <SearchTrigger {...props} />
    </>
  );
}

export function VersionSwitcher() {
  const { versions, pathname, current, active } = useCurrentVersion();
  const [open, setOpen] = useState(false);

  if (!current || versions.length < 2) return null;

  // Like the native switcher: stay on the same page if it exists in the chosen version,
  // otherwise open that version's landing page.
  const hrefFor = (version: DocsVersion) => {
    if (!active) return version.url;
    const target = versionBase(version.slug) + pathname.slice(versionBase(active.slug).length);
    return version.pages.includes(target) ? target : version.url;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Select version"
        className="flex shrink-0 items-center gap-1.5 rounded-full border bg-fd-secondary/50 px-3 py-1.5 text-sm font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-accent data-[state=open]:bg-fd-accent data-[state=open]:text-fd-accent-foreground"
      >
        {current.title}
        <ChevronsUpDown className="size-4 text-fd-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-auto min-w-(--radix-popover-trigger-width) flex-col gap-1 p-1">
        {versions.map((version) => (
          <Link
            key={version.slug}
            href={hrefFor(version)}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg p-1.5 text-sm font-medium hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            {version.title}
            <Check
              className={cn('ms-auto size-3.5 shrink-0 text-fd-primary', version.slug !== current.slug && 'invisible')}
            />
          </Link>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// Same classes as Fumadocs' native items in the three contexts where the main links appear.
const linkVariants = {
  // HomeLayout navbar ("main" items).
  nav: 'inline-flex items-center gap-1 p-2 text-sm text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground data-[active=true]:text-fd-primary [&_svg]:size-4',
  // HomeLayout mobile dropdown menu.
  menu: 'inline-flex items-center gap-2 py-1.5 transition-colors hover:text-fd-popover-foreground/50 data-[active=true]:font-medium data-[active=true]:text-fd-primary [&_svg]:size-4',
  // DocsLayout (notebook) sidebar / mobile drawer.
  sidebar:
    'relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground wrap-anywhere [&_svg]:size-4 [&_svg]:shrink-0 transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80 hover:transition-none data-[active=true]:bg-fd-primary/10 data-[active=true]:text-fd-primary data-[active=true]:hover:transition-colors',
};

/**
 * Main links: the current version's home (icon only in the navbar) and the sections,
 * all relative to the current version.
 */
export function VersionedNavLinks({
  items,
  variant = 'nav',
}: {
  items: { text: string; section: string }[];
  variant?: keyof typeof linkVariants;
}) {
  const { pathname, current } = useCurrentVersion();

  if (!current) return null;

  // In the version home drawer the sidebar tree already lists the sections, so we keep only
  // Home. On other pages the tree shows only the current section, so the sections stay
  // (otherwise they would not be reachable from the drawer).
  const sections = variant === 'sidebar' && pathname === current.url ? [] : items;

  const links = [
    {
      key: 'home',
      url: current.url,
      active: pathname === current.url,
      label: 'Home',
      icon: <House />,
    },
    ...sections.map((item) => {
      const url = `${versionBase(current.slug)}/${item.section}`;
      return { key: item.section, url, active: isWithin(pathname, url), label: item.text, icon: null };
    }),
  ];

  return links.map(({ key, url, active, label, icon }) => {
    const iconOnly = variant === 'nav' && icon;
    const link = (
      <Link
        key={key}
        href={url}
        data-active={active}
        aria-label={iconOnly ? `${current.title} ${label}` : undefined}
        className={linkVariants[variant]}
      >
        {icon}
        {!iconOnly && label}
      </Link>
    );

    // In the navbar, items are <li> elements of the HomeLayout list.
    return variant === 'nav' ? <li key={key}>{link}</li> : link;
  });
}
