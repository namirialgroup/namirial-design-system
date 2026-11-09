export const appName = 'Namirial Design System';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

// Root-type versioning: content lives under /docs/v1 and /docs/v2.
// `defaultVersion` is the version shown when opening /docs and the target of
// "unversioned" navigation links. The only place to change when bumping the version.
export const defaultVersion: string = 'v1';
export const defaultDocsRoute = `${docsRoute}/${defaultVersion}`;

// fill this with your actual GitHub info, for example:
export const gitConfig = {
  user: 'namirialgroup',
  repo: 'namirial-design-system',
  branch: 'main',
};
