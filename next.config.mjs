// ... existing code ...
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // <CHANGE> Allow external images from Twitter/X for the logo
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
    ],
  },
  // <CHANGE> Add empty turbopack config to silence warning
  turbopack: {},
}

export default nextConfig
