/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
    ],
  },
  // <CHANGE> Add webpack config to exclude test files and handle optional dependencies
  webpack: (config, { isServer }) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    
    // Exclude test files from build
    config.module.rules.push({
      test: /node_modules.*\.(test|spec)\.(js|ts|jsx|tsx)$/,
      use: 'ignore-loader',
    })
    
    return config
  },
  // <CHANGE> Add empty turbopack config to silence warnings
  turbopack: {},
}

export default nextConfig
