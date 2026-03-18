/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Tells Next.js to build a static site
  images: {
    unoptimized: true, // Required for static exports
  },
};

export default nextConfig;