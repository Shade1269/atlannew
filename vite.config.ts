/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// import purgecss from "vite-plugin-purgecss"; // معطّل — كان يسبب عرض واجهة الموبايل على الشاشات الكبيرة

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/"],
    },
  },
  server: {
    host: "::",
    port: 8080,
    fs: {
      strict: false,
    },
  },
  optimizeDeps: {
    include: ['@react-three/fiber', '@react-three/drei', 'three'],
    exclude: [],
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // تعطيل PurgeCSS في الإنتاج — كان يحذف كلاسات الـ responsive (lg:, md:) فتبقى واجهة الموبايل على الشاشات الكبيرة. Tailwind ينظّف CSS غير المستخدم من تلقاء نفسه.
    // mode === 'production' && purgecss({ ... }) as any,
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("/three/") || id.includes("\\three\\")) {
            return "three";
          }

          if (id.includes("@supabase")) {
            return "supabase";
          }

          if (id.includes("@tanstack/react-query")) {
            return "react-query";
          }

          if (id.includes("framer-motion") || id.includes("recharts")) {
            return "visualizations";
          }

          return "vendor";
        },
      },
    },
  },
}));
