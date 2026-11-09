import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Noto_Sans, Open_Sans } from 'next/font/google';

// Both fonts are loaded and exposed as CSS variables: the body font is picked per
// documentation version in app/styles/fumadocs-theme.css (v1 Open Sans, v2 Noto Sans).
const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
});

const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-noto-sans',
});

// Fumadocs' static search client derives the base path from `import.meta.env.BASE_URL`
// (a Vite convention), which is undefined in Next → it would use `/api/search`.
// On GitHub Pages the site lives under /namirial-design-system, so we pass the index URL
// explicitly with Next's basePath, so that the static index (out/api/search) is found in
// production too. Stays "" locally.
// Note: in the default dialog the `api` option is forwarded as `from` to the static client.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${openSans.variable} ${notoSans.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider search={{ options: { type: 'static', api: `${basePath}/api/search` } }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
