import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { counts, projectFilters, projectsGrid, workBox, workList } from './src/render.js';

/* Swaps <!--@name--> markers in the HTML for markup built from the project
   data, in dev and in the build alike. */
function projectMarkup() {
  const n = counts();
  const blocks = {
    'projects-grid': projectsGrid,
    'projects-filters': projectFilters,
    'work-box': workBox,
    'work-list': workList,
    'journey-map': () => readFileSync(resolve(__dirname, 'src/journey-map.svg'), 'utf8'),
    'count-all': () => String(n.all),
    'count-websites': () => String(n.websites),
  };
  return {
    name: 'project-markup',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(/<!--@([a-z-]+)-->/g, (match, key) => (blocks[key] ? blocks[key]() : match));
      },
    },
  };
}

export default defineConfig({
  plugins: [projectMarkup()],
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        projects: resolve(__dirname, 'projects.html'),
        lost: resolve(__dirname, '404.html'),
      },
    },
  },
});
