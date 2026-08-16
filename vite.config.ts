import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { geminiPlugin } from "./vite-plugin-gemini.ts";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      geminiPlugin({
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL,
      }),
    ],
  };
});
