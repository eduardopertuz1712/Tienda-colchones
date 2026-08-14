import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 5 imágenes x 5 MB + margen para el overhead de multipart
      // (boundaries, cabeceras de cada parte y metadatos de campos).
      bodySizeLimit: "26mb",
    },
  },
};

export default nextConfig;