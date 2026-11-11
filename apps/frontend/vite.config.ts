import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    proxy: {
      "/rpc": {
        target: "http://127.0.0.1:3000",
        headers: {
          authorization: `Bearer ${loadEnv(mode, "../..", "").API_TOKEN ?? ""}`,
        },
      },
    },
  },
}));
