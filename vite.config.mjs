import path from "node:path";
import { defineConfig } from "vite";

const rootDir = path.resolve(process.cwd(), "src");

const alias = {
  "@app": path.resolve(rootDir, "core/app"),
  "@core": path.resolve(rootDir, "core"),
  "@renderer": path.resolve(rootDir, "renderer"),
  "@visualizer": path.resolve(rootDir, "visualizer"),
};

export default defineConfig({
  resolve: {
    alias,
  },
  base: "./",
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist/renderer",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        index: path.resolve(process.cwd(), "index.html"),
        url: path.resolve(process.cwd(), "url.html"),
      },
    },
  },
});