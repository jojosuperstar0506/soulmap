import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/app.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      {
        source: '/styles.css',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
    ];
  },
  // Anchor the workspace root to this project directory.
  // Without this, Next.js can pick up a stray package-lock.json in a parent
  // directory and treat that as the root — causing .env.local to be missed and
  // file-tracing bundles to be built from the wrong base path.
  outputFileTracingRoot: path.join(__dirname),

  // Force-include the BaZi system prompt Markdown file in the
  // /api/narrative serverless function bundle on Vercel.
  // Without this, fs.readFileSync can't find it at runtime because
  // @vercel/nft can't statically trace path.join(process.cwd(), ...) calls.
  outputFileTracingIncludes: {
    '/api/narrative': ['./src/content/**/*.md'],
    '/api/oracle':    ['./src/content/**/*.md'],
  },
};

export default nextConfig;
