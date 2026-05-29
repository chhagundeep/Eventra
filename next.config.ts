/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure 'output: export' is removed to allow dynamic features 
  // and image optimization to work properly.

  async redirects() {
    return [
      // Browsers request /favicon.ico by default before parsing <head>.
      { source: "/favicon.ico", destination: "/icon.png", permanent: false },
      // Legacy path from earlier metadata config.
      { source: "/favicon.png", destination: "/icon.png", permanent: false },
    ];
  },

  images: {
    // Allows Next.js to serve images from your Cloudinary account
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dfxae9jrx/**', // Your specific cloud_name
      },
    ],
    // If you are deploying to Vercel, you can set this to false 
    // to use their built-in image optimization.
    unoptimized: true, 
  },
};

export default nextConfig;