/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: { "/*": ["./certs/*.crt"] },
  images: {
    // Article images are committed to /public and served from this origin, so no
    // remote patterns are needed. Add one here only if you ever host images
    // elsewhere — an open remote-image policy lets others use your optimiser.
    remotePatterns: process.env.SUPABASE_URL
      ? [
          {
            protocol: "https",
            hostname: new URL(process.env.SUPABASE_URL).hostname,
            pathname: "/storage/v1/object/public/article-media/**",
          },
        ]
      : [],
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
