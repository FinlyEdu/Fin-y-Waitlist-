import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: { port: 4173 },
  resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
});
