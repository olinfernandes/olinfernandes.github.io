import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import compress from "astro-compress";
import tailwind from "@astrojs/tailwind";
import games from "./games/integration";

// https://astro.build/config
export default defineConfig({
  site: "https://olinfernandes.github.io",
  integrations: [mdx(), sitemap(), compress(), tailwind(), games()],
});
