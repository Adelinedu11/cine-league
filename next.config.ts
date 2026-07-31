import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Affiches TMDB servies via next/image.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

export default nextConfig;
