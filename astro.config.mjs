import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://abdmmar.com",
  integrations: [mdx(), sitemap(), react(), robotsTxt()],

  markdown: {
    syntaxHighlight: "prism",
  },

  adapter: cloudflare(),
});