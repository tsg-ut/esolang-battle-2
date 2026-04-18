/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@esolang-battle/db', '@esolang-battle/common'],
};

module.exports = nextConfig;
