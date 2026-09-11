/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: { "/*": ["./certs/*.crt"] },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Article images are committed to /public and served from this origin, so no
    // remote patterns are needed. Add one here only if you ever host images
    // elsewhere: an open remote-image policy lets others use your optimizer.
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
