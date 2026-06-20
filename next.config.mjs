/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lint is run separately (npm run lint); don't fail production builds on it.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
