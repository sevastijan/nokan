import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
     output: 'standalone',
     images: {
          remotePatterns: [
               {
                    protocol: 'https',
                    hostname: 'lh3.googleusercontent.com',
                    port: '',
                    pathname: '/**',
               },
               {
                    protocol: 'https',
                    hostname: 'ui-avatars.com',
                    port: '',
                    pathname: '/**',
               },
               {
                    protocol: 'https',
                    hostname: 'api.supabase.nkdlab.space',
                    port: '',
                    pathname: '/storage/v1/object/public/**',
               },
          ],
     },
};

export default nextConfig;
