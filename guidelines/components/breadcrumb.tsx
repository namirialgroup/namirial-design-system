'use client';

import { useBreadcrumb } from 'fumadocs-core/breadcrumb';
import type { Root } from 'fumadocs-core/page-tree';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '@/lib/cn';

export function Breadcrumb({ tree }: { tree: Root }) {
  const pathname = usePathname();
  const items = useBreadcrumb(pathname, tree, { includePage: true });

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      // Visible only from 768px (max-width: 768px)
      className="hidden max-[768px]:flex flex-row items-center gap-1 text-sm text-fd-muted-foreground mb-2"
    >
      {items.map((item, i) => (
        <Fragment key={i}>
          {i !== 0 && (
            <ChevronRight className="size-4 shrink-0 rtl:rotate-180" />
          )}
          {item.url ? (
            <Link
              href={item.url}
              className="truncate transition-colors hover:text-fd-accent-foreground"
            >
              {item.name}
            </Link>
          ) : (
            <span className={cn('truncate', i === items.length - 1 && 'text-fd-foreground')}>
              {item.name}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
