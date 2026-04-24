import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/preload.cts",
      formats: ["cjs"],
      fileName: () => "preload.js",
    },
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      external: ["electron"],
    },
  },
});