import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Xuất web tĩnh: `npm run build` tạo thư mục `out/` chỉ gồm HTML/CSS/JS.
  // Không bật cacheComponents/partialPrefetching vì PPR không hỗ trợ chế độ export.
  output: "export",
  images: { unoptimized: true },
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
