/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove or comment out 'output: export'
  // output: 'export', 
  images: {
    // You can keep this or set it to false if you use a provider like Vercel
    unoptimized: true, 
  },
};

export default nextConfig;