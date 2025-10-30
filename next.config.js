/**
 * Minimal Next.js config for Next 16+ (Turbopack).
 * - Removes unsupported/invalid top-level options (swcMinify, optimizeFonts).
 * - Avoids using boolean experimental.serverActions (remove or replace with correct shape).
 * - Adds an explicit empty `turbopack` config to silence the Turbopack/webpack mismatch warning.
 *
 * If you need to continue using a custom webpack config, either:
 *  - Migrate to Turbopack (preferred), or
 *  - Start dev with: npm run dev -- --webpack
 */
module.exports = {
  reactStrictMode: true,

  // Keep this present to indicate Turbopack usage and silence the warning.
  // Add properties here if you later migrate configuration to Turbopack.
  turbopack: {},

  // Allow images from Unsplash (and add more hosts here if needed)
  images: {
    domains: ['images.unsplash.com'],
    // alternatively use remotePatterns for fine-grained control:
    // remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },

  // If you need to use a custom webpack config, run dev with --webpack or migrate to Turbopack.
  // webpack: (config, { dev, isServer }) => {
  //   return config;
  // },
};
