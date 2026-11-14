import react from '@vitejs/plugin-react';
import { defineConfig } from "vitest/config";

// Relative base so the build works from any path (GitHub Pages, file server, tablet).
// Fonts are inlined so the app has no network dependency at run time.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { assetsInlineLimit: 200000, cssCodeSplit: false },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
