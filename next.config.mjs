/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['mongoose'],
  webpack: (config) => {
    // Add specific handling for Mongoose in server components
    config.externals = [...(config.externals || []), 'mongoose'];
    return config;
  },
};

export default nextConfig; 