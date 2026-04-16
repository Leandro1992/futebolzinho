/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    externalDir: true,
    serverComponentsExternalPackages: ["firebase-admin"],
  },
};

export default nextConfig;
