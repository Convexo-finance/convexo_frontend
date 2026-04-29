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
      {
        protocol: 'https',
        hostname: 'nft-cdn.alchemy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.alchemyapi.io',
        pathname: '/**',
      },
    ],
  },
  // Turbopack powers `next dev` (fast HMR, fast startup).
  // thread-stream is a Node.js Worker Thread lib — alias it to the browser stub so Turbopack drops it.
  turbopack: {
    resolveAlias: {
      'thread-stream': './lib/stubs/thread-stream.js',
    },
  },
  // Webpack powers `next build` (see package.json "build" script: --webpack).
  // thread-stream is a Node.js Worker Thread lib pulled in by pino → zkpassport/account-kit.
  // It must never be bundled for the browser — alias it to false so webpack drops it entirely.
  webpack: (config) => {
    const path = require('path');
    const emptyStub = path.resolve(__dirname, 'lib/stubs/empty.js');
    config.resolve.alias['thread-stream'] = false;
    // @privy-io/react-auth bundles Solana peer deps unconditionally. The installed
    // @solana/kit version (2.x) conflicts with what @solana-program/token@0.9 expects (^5).
    // We don't use Solana — replace all four packages with an empty stub.
    config.resolve.alias['@solana/kit'] = emptyStub;
    config.resolve.alias['@solana-program/memo'] = emptyStub;
    config.resolve.alias['@solana-program/system'] = emptyStub;
    config.resolve.alias['@solana-program/token'] = emptyStub;
    config.resolve.alias['@farcaster/mini-app-solana'] = emptyStub;
    return config;
  },
}

module.exports = nextConfig
