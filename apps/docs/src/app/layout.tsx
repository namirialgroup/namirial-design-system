import type { Metadata } from "next";
import "@namirial/design-system/tokens.css";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeContext";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Namirial Design System",
  description: "Enterprise design system — Figma as single source of truth",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("nds-theme");var d=typeof window!="undefined"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.setAttribute("data-theme",t==="dark"||t==="light"?t:d?"dark":"light");})();`,
          }}
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <Header />
          <main className="nds-main">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
