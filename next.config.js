/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow remote media (YouTube thumbs, Supabase storage, etc.).
    // Add your own hostnames here as you plug in real content.
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
};

module.exports = nextConfig;
