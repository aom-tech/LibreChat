// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';

// https://astro.build/config
export default defineConfig({
  site: 'https://cogneex.ru',
  output: 'server',
  integrations: [
    sitemap(),
    compress({
      CSS: true,
      HTML: true,
      Image: false,
      JavaScript: true,
      SVG: true,
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});