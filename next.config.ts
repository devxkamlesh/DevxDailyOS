import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Suppress source map warnings from @supabase/auth-js
  serverExternalPackages: ['@supabase/auth-js'],
  
  // Turbopack configuration
  turbopack: {
    resolveAlias: {
      // Helps with source map issues
    },
  },
  
  // Webpack fallback for non-Turbopack builds
  webpack: (config, { isServer }) => {
    // Ignore source map warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase/ },
      { message: /Invalid source map/ },
    ];
    return config;
  },
};

export default nextConfig;
