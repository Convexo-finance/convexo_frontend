/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lime-famous-condor-7.mypinata.cloud',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: '*.mypinata.cloud',
        pathname: '/ipfs/**',
      },
    ],
  },
}

module.exports = nextConfig

