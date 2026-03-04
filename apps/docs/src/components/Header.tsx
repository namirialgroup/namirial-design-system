"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/variables", label: "Variables" },
  { href: "/components", label: "Components" },
  { href: "/patterns", label: "Patterns" },
  { href: "/experimental", label: "Experimental" },
  { href: "/changelog", label: "Changelog" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="nds-header">
      <div className="nds-header-inner">
        <Logo />
        <nav className="nds-nav" aria-label="Principale">
          {navItems.map(({ href, label }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`nds-nav-link ${isActive ? "nds-nav-link--active" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="nds-header-actions">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
