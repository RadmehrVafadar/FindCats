import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react(), {
    name: 'defer-entry-until-document-base',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      // Inline imports prevent speculative asset fetches before the base is set.
      handler: html => html
        .replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g,
          (_, src: string) => `<script type="module">import(${JSON.stringify(src)})</script>`)
        .replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g,
          (_, href: string) => `<script>document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: ${JSON.stringify(href)} }))</script>`),
    },
  }],
})
