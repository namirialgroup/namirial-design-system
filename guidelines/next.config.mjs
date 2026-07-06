import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

// In CI viene valorizzato da GitHub Pages (es. "/namirial-design-system");
// in locale non è settato, quindi resta "" e non interferisce con `npm run dev`.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'export', // genera la cartella ./out con l'HTML statico (richiesto da GitHub Pages)
  images: { unoptimized: true }, // l'ottimizzatore immagini non è disponibile in export statico
  basePath, // fa sì che asset e link puntino a /namirial-design-system/...
};

export default withMDX(config);
