import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="nds-logo" aria-label="Namirial Design System - Home">
      <span className="nds-logo-mark">NDS</span>
      <span className="nds-logo-text">Namirial Design System</span>
    </Link>
  );
}
