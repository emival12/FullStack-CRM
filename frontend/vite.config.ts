import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: true,
    port: 3000,
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
  test: { environment: "node" },
});
