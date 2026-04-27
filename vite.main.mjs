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
  build: {
    lib: {
      entry: "src/main.ts",
      formats: ["cjs"],
      fileName: () => "main.cjs",
    },
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      external: [
        "electron",
        /^node:/,
      ],
    },
  },
});