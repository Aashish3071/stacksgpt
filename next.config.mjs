/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Article images are committed to /public and served from this origin, so no
    // remote patterns are needed. Add one here only if you ever host images
    // elsewhere — an open remote-image policy lets others use your optimiser.
    remotePatterns: [],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // `publication/` is a separate app that lives inside this repo and carries
      // its own node_modules (50k+ files). Without this the dev watcher crawls
      // all of it and compilation stalls for minutes.
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/node_modules/**", "**/publication/**", "**/.git/**"],
      };
    }
    return config;
  },
};

export default nextConfig;
