import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy each stage's API to same-origin paths so the unified frontend never
// deals with CORS across the three independent backends:
//   /api         -> Stage 2 aggregation backend  (port 8000)
//   /voice-api   -> Stage 1 voice_agent backend   (port 8001)
//   /letters-api -> Stage 3 letter_service        (port 8002)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/voice-api": {
        target: "http://localhost:8001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/voice-api/, ""),
      },
      "/letters-api": {
        target: "http://localhost:8002",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/letters-api/, ""),
      },
    },
  },
});
