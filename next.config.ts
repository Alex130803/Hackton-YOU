import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Find brands is the home screen; old /discover links (and ?view=history) land there. /discover/[id] stays.
  async redirects() {
    return [{ source: "/discover", destination: "/", permanent: false }];
  },
  devIndicators: false, // hides the Next.js badge that covered the sidebar account button
};

export default nextConfig;
