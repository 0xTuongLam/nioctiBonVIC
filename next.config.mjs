/** @type {import('next').NextConfig} */
const nextConfig = {
  // <CHANGE> Remove typescript ignore, fix type errors properly
  images: {
    unoptimized: true,
  },
  // <CHANGE> Add webpack config to handle wagmi properly
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
}

export default nextConfig
