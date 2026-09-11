import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IIFE-бандл, в pack.ps1 встраивается inline в HTML (без type="module").
// WebKit 1С: https://infostart.ru/1c/articles/2411240/
export default defineConfig({
  plugins: [react()],
  base: "./",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": "{}",
  },
  build: {
    target: "es2015",
    cssCodeSplit: false,
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "src/main.tsx"),
      name: "EdoApp",
      formats: ["iife"],
      fileName: () => "app.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: "app[extname]",
        extend: true,
      },
    },
  },
});
