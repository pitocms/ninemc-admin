/** @type {import('next').NextConfig} */
const nextConfig = {
    // App Router doesn't use the old i18n config
    // We'll handle i18n through our custom hook and context
    
    // Enable standalone output for Docker
    output: 'standalone',
    
    // Optimize for production
    experimental: {
      optimizePackageImports: ['lucide-react'],
    },
    
    // Environment variables
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },
  };
  
  export default nextConfig;