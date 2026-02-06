import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost", // "::" ko hata kar localhost kiya taaki WebSocket connect ho sake
    port: 8080,
    strictPort: true,
    hmr: {
      clientPort: 8080,
      host: "localhost",
    },
    // Proxy add kiya hai taaki /api requests seedha backend par jayein
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Yahan apne BACKEND ka port daal (agar 3000 hai toh)
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));