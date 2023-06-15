import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  root: "src",
  plugins: [react()],
  build: {
    outDir: "../../web/dist",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": "http://127.0.0.1:21234",
      "/ws": "http://127.0.0.1:21234",
      "/log": "http://127.0.0.1:21234",
    },
  },
});
