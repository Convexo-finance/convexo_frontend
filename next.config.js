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
    config.resolve.alias['thread-stream'] = false;
    return config;
  },
}

module.exports = nextConfig
