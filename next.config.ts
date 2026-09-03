import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'Elevator-Tales';
const pagesBasePath = isGitHubPages ? `/${repositoryName}` : '';

const nextConfig: NextConfig = {
  ...(isGitHubPages
    ? {
        output: 'export' as const,
        assetPrefix: pagesBasePath,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
