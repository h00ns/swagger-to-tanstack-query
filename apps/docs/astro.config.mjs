// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import expressiveCode from "astro-expressive-code";
import tailwindcss from "@tailwindcss/vite";
import { s2tqNight } from "./src/lib/shiki-theme.ts";

// https://astro.build/config
export default defineConfig({
  site: "https://swagger-to-tanstack-query.vercel.app",
  // Static output served at the domain root (Vercel). No `base` path.
  integrations: [
    // expressiveCode must be registered before mdx so it can process code blocks.
    expressiveCode({
      themes: [s2tqNight],
      styleOverrides: {
        borderRadius: "var(--radius-xl)",
        codeFontFamily: "var(--font-mono)",
        codeFontSize: "0.875rem",
        codeLineHeight: "1.65",
        borderColor: "var(--color-border)",
        frames: {
          editorActiveTabIndicatorTopColor: "var(--color-primary)",
          editorTabBarBackground: "var(--color-surface-raised)",
          editorBackground: "var(--color-surface-inset)",
          terminalBackground: "var(--color-surface-inset)",
          terminalTitlebarBackground: "var(--color-surface-raised)",
        },
      },
    }),
    mdx(),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
