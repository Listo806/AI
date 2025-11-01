// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ✅ Official Vite configuration for Listo Qasa – AI CRM
// This ensures JSX compiles, the React plugin runs, and Netlify sees the proper build output.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist", // Netlify publish directory
    sourcemap: false, // optional: smaller production bundle
  },
  server: {
    port: 5173, // Local dev server port (vite --port 5173)
    open: true, // automatically opens browser on npm run dev
  },
});
