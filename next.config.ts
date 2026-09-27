import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  devIndicators: false,
  outputFileTracingIncludes: {
    '/private/session': ['./private/gallery/manifest.json'],
    '/private/photos/*': ['./private/gallery/**/*'],
  },
  outputFileTracingExcludes: {
    '/*': ['./private/gallery-originals/**/*', './private/gallery-access.txt'],
  },
};

export default nextConfig;
