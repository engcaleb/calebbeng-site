import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (practice logos + product images)
      {
        protocol: "https",
        hostname: "fmwicqeqpffmvqyerpyo.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Amazon product images (for future use)
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images-na.ssl-images-amazon.com" },
    ],
  },
};

export default nextConfig;
