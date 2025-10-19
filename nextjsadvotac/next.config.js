/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/fastapi/:path*',
        destination: 'https://api.advotac.com/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
