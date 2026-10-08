/** @type {import('next').NextConfig} */
const pages = ['owner-operators', 'trucks', 'jobs', 'about', 'contact', 'apply'];

const nextConfig = {
  reactStrictMode: true,
  images: {
    // Truck photos are 300–500 KB originals; the optimizer serves phone-sized AVIF/WebP instead.
    remotePatterns: [
      { protocol: 'https', hostname: 'img.bipolar-bear.com' },
      { protocol: 'https', hostname: 'img.joshua-llc.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [480, 640, 828, 1080, 1280, 1600, 1920, 2560],
    qualities: [75, 90],
    imageSizes: [96, 160, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async redirects() {
    // Keep the classic *.html URLs working.
    return [
      { source: '/index.html', destination: '/', permanent: true },
      ...pages.map((p) => ({ source: `/${p}.html`, destination: `/${p}`, permanent: true })),
    ];
  },
};

export default nextConfig;
