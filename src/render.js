/*
 * Build-time HTML for everything that comes from the project data. The Vite
 * plugin in vite.config.js swaps <!--@name--> markers for these strings, so
 * every card is real HTML in the page (fast, crawlable, works without JS),
 * and script.js only adds behaviour on top.
 */
import { CATEGORIES, PROJECTS } from './data/projects.js';
import { FEATURED } from './data/featured.js';

export const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const bySlug = Object.fromEntries(PROJECTS.map(p => [p.slug, p]));
const line = p => p.headline || p.outcome[0] || p.summary;

function media(p, { eager = false, sizes = '' } = {}) {
  const loading = eager ? 'eager' : 'lazy';
  return `<span class="media" data-initial="${esc(p.name.charAt(0))}"><img src="${esc(p.cover)}" alt="${esc(p.name)}" loading="${loading}" decoding="async"${sizes}></span>`;
}

export function projectCard(p, i) {
  const tags = [`<span class="tag">${esc(p.category)}</span>`];
  if (p.nda) tags.push('<span class="tag tag-soft">Under NDA</span>');
  return `<a class="work-card" href="${esc(p.href)}" target="_blank" rel="noopener" data-slug="${esc(p.slug)}" data-category="${slugify(p.category)}" data-keywords="${esc([p.name, p.client, p.industry, p.category, p.headline].join(' ').toLowerCase())}">
  ${media(p, { eager: i < 3 })}
  <span class="work-card-text"><strong>${esc(p.name)}</strong><span>${esc(line(p))}</span></span>
  <span class="work-card-tags">${tags.join('')}</span>
</a>`;
}

export const projectsGrid = () => PROJECTS.map(projectCard).join('\n');

export function projectFilters() {
  const chips = [`<button type="button" class="chip is-active" data-filter="all" aria-pressed="true">All <span>${PROJECTS.length}</span></button>`];
  for (const c of CATEGORIES) {
    const n = PROJECTS.filter(p => p.category === c).length;
    chips.push(`<button type="button" class="chip" data-filter="${slugify(c)}" aria-pressed="false">${esc(c)} <span>${n}</span></button>`);
  }
  return chips.join('\n');
}

const ICONS = {
  app: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M2 9h20M6 4v5M10 4v5"/>',
  deck: '<path d="M2 3h20M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3M7 21l5-5 5 5"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
  pen: '<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.59 7.59"/><circle cx="11" cy="11" r="2"/>',
  book: '<path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
};
const icon = k => `<svg class="i" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">${ICONS[k]}</svg>`;

/* the cards standing in the box; script places and animates them */
export function workBox() {
  return FEATURED.map((f, i) => {
    const n = PROJECTS.filter(p => p.category === f.category).length;
    return `<a class="wk" href="/projects#${slugify(f.category)}" data-k="${i}" style="--from:${f.from};--to:${f.to}" aria-label="${esc(f.category)}, ${n} projects" tabindex="-1">
  <span class="wk-top"><span class="wk-ic">${icon(f.icon)}</span><span class="wk-tag">${String(i + 1).padStart(2, '0')}</span></span>
  <span class="wk-body"><span class="wk-hand">${esc(f.category)}</span><strong class="wk-big">${esc(f.stat)}</strong><span class="wk-sub">${esc(f.label)}</span></span>
  <span class="wk-foot">${n} projects</span>
</a>`;
  }).join('\n');
}

/* the same cards as a list you can swipe through */
export function workList() {
  return FEATURED.map((f, i) => {
    const n = PROJECTS.filter(p => p.category === f.category).length;
    return `<li><a class="citem" href="/projects#${slugify(f.category)}" data-k="${i}" style="--from:${f.from};--to:${f.to}">
  <span class="ci-num">${String(i + 1).padStart(2, '0')}</span>
  <span class="ci-text"><b>${esc(f.category)}</b><span>${esc(f.clients)}</span></span>
  <span class="ci-count">${n}</span>
</a></li>`;
  }).join('\n');
}

export const counts = () => ({
  all: PROJECTS.length,
  websites: PROJECTS.filter(p => p.category === 'Websites').length,
});
