import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const repo = 'namirial-design-system';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'export',
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
  images: {
    unoptimized: true,
  },
};

export default withMDX(config);