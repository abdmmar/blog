import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://abdmmar.com",
  integrations: [
    tailwind({
      config: {
        applyBaseStyles: false,
      },
    }),
    mdx(),
    sitemap(),
    react(),
  ],
  markdown: {
    // Can be 'shiki' (default), 'prism' or false to disable highlighting
    syntaxHighlight: "prism",
  },
});
