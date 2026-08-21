import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "PunchCloud Admin",
        short_name: "PC Admin",
        description: "PunchCloud — HR dashboard",
        theme_color: "#2563eb",
        background_color: "#f9fafb",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icons/icon.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "icons/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
    }),
  ],
  server: { port: 5173 },
});
