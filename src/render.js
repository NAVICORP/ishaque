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

export function workDeck() {
  return FEATURED.map(({ category, cover, stat, line: text, about }, i) => {
    const p = bySlug[cover];
    if (!p) throw new Error(`Deck cover project not found: ${cover}`);
    const n = PROJECTS.filter(x => x.category === category).length;
    const lead = stat
      ? `<span class="deck-stat"><strong>${esc(stat.value)}</strong><span>${esc(stat.label)}</span></span>`
      : `<span class="deck-line">${esc(text)}</span>`;
    return `<a class="deck-card" href="/projects#${slugify(category)}" data-index="${i}" data-about="${esc(about)}" data-category="${esc(category)}" aria-label="${esc(category)}, ${n} projects">
  ${media(p, { eager: i < 2 })}
  <span class="deck-card-body">
    <span class="deck-card-top"><strong>${esc(category)}</strong><span class="tag">${n} projects</span></span>
    ${lead}
  </span>
</a>`;
  }).join('\n');
}

const domain = url => {
  try { return new URL(url).host.replace(/^www\./, ''); } catch { return ''; }
};

export function websitesStrip() {
  const local = p => (p.cover.startsWith('/') ? 0 : 1);
  return PROJECTS.filter(p => p.category === 'Websites').sort((a, b) => local(a) - local(b)).map(p => `<a class="site" href="${esc(p.live || p.href)}" target="_blank" rel="noopener" data-slug="${esc(p.slug)}">
  <span class="chrome" aria-hidden="true"><i></i><i></i><i></i><span>${esc(domain(p.live || p.href))}</span></span>
  ${media(p)}
  <strong>${esc(p.name)}</strong>
</a>`).join('\n');
}

export const counts = () => ({
  all: PROJECTS.length,
  websites: PROJECTS.filter(p => p.category === 'Websites').length,
});
