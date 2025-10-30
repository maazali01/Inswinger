/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  swcMinify: true,            // faster/minified builds
  optimizeFonts: true,        // reduce font layout shifts
  experimental: {
    serverActions: true,
  },
  webpack(config) {
    config.ignoreWarnings = config.ignoreWarnings || [];
    // Ignore the runtime "Critical dependency: the request of a dependency is an expression"
    // coming from some @supabase/* compiled files — harmless in our runtime usage.
    config.ignoreWarnings.push((warning) => {
      const msg = typeof warning.message === 'string' ? warning.message : '';
      return msg.includes('Critical dependency: the request of a dependency is an expression');
    });
    return config;
  },
};

module.exports = nextConfig;
