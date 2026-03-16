/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  outputFileTracingRoot: path.join(__dirname, '../'),
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
  // Externalize packages with native dependencies that can't be bundled
  serverExternalPackages: ['pm2', 'pm2-deploy', '@pm2/blessed', 'blessed', 'pty.js', 'fsevents', 'pdfkit', 'fontkit'],
};

module.exports = nextConfig;
