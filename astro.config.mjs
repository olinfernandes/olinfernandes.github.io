import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
	site: 'https://olinfernandes.github.io',
  base: 'blogs',
	integrations: [mdx(), sitemap()],
});
