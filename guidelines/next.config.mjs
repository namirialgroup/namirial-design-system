import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

// Set by GitHub Pages in CI (e.g. "/namirial-design-system");
// not set locally, so it stays "" and does not interfere with `npm run dev`.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'export', // generates the ./out folder with static HTML (required by GitHub Pages)
  images: { unoptimized: true }, // the image optimizer is not available in static export
  basePath, // makes assets and links point to /namirial-design-system/...
};

export default withMDX(config);
