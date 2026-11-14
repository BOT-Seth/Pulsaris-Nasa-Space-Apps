import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { port: 5173, host: true }, // host: true so a tablet on the same Wi-Fi can open it
});
