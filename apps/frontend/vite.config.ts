import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  const apiTarget = env.API_PROXY_TARGET ?? "http://localhost:3300";

  const proxy = {
    "/vulkan": {
      target: apiTarget,
      changeOrigin: true,
      cookieDomainRewrite: "",
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": resolve(rootDir, "src"),
      },
    },
    server: {
      proxy,
    },
  };
});
