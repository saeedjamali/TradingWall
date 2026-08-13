/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      enabled: true,
      bodySizeLimit: '4mb',
    },
  },
  // Avoid custom global headers on /_next/static — can interfere with
  // production static asset serving on some hosts.
}

module.exports = nextConfig
