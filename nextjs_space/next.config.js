import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  outputFileTracingRoot: path.join(__dirname, '../'),
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
  eslint: {
    dirs: ['.'], // Lint the current directory only and do not append 'lint'
  },
};

export default nextConfig;
