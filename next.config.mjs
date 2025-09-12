/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        port: '',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'api.universalprofile.cloud',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/giftmojiapi/upload/images/**',
      },
      {
        protocol: 'https',
        hostname: 'giftmoji.aratta.dev',
        port: '',
        pathname: '/upload/images/**',
      },
    ],
  },
}

export default nextConfig
