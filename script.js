const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const header = document.querySelector('[data-header]');
const progressBar = document.querySelector('.scroll-progress span');
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const toast = document.querySelector('.toast');
let lastScrollY = window.scrollY;
let toastTimer;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function updateScrollUI() {
  const currentY = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.transform = `scaleX(${maxScroll > 0 ? currentY / maxScroll : 0})`;
  header.classList.toggle('is-scrolled', currentY > 24);

  if (!document.body.classList.contains('menu-open')) {
    const scrollingDown = currentY > lastScrollY && currentY > 220;
    header.classList.toggle('is-hidden', scrollingDown);
    document.body.classList.toggle('header-hidden', scrollingDown);
  }
  lastScrollY = currentY;
}

let scrollQueued = false;
window.addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    updateScrollUI();
    scrollQueued = false;
  });
}, { passive: true });
updateScrollUI();

function setMenu(open) {
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mobileMenu.setAttribute('aria-hidden', String(!open));
  mobileMenu.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  document.body.classList.remove('header-hidden');
  header.classList.remove('is-hidden');
}

menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
    setMenu(false);
    menuToggle.focus();
  }
});

const reveals = document.querySelectorAll('.reveal');
if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  reveals.forEach(item => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.13, rootMargin: '0px 0px -40px' });
  reveals.forEach(item => revealObserver.observe(item));
}

const counterElements = document.querySelectorAll('[data-counter]');
function animateCounter(element) {
  const target = Number(element.dataset.counter);
  const prefix = element.dataset.prefix || '';
  const suffix = element.dataset.suffix || '';
  if (prefersReducedMotion) {
    element.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
    return;
  }
  const start = performance.now();
  const duration = 1300;
  function step(now) {
    const elapsed = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - elapsed, 4);
    element.textContent = `${prefix}${Math.round(target * eased).toLocaleString()}${suffix}`;
    if (elapsed < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

if ('IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  }, { threshold: .55 });
  counterElements.forEach(counter => counterObserver.observe(counter));
} else {
  counterElements.forEach(animateCounter);
}

document.querySelectorAll('.service-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.service-item');
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    const willOpen = !item.classList.contains('is-open');

    document.querySelectorAll('.service-item').forEach(otherItem => {
      const otherTrigger = otherItem.querySelector('.service-trigger');
      const otherPanel = document.getElementById(otherTrigger.getAttribute('aria-controls'));
      otherItem.classList.remove('is-open');
      otherTrigger.setAttribute('aria-expanded', 'false');
      if (otherItem !== item) window.setTimeout(() => { otherPanel.hidden = true; }, 360);
    });

    if (willOpen) {
      panel.hidden = false;
      requestAnimationFrame(() => {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      });
    } else {
      window.setTimeout(() => { panel.hidden = true; }, 360);
    }
  });
});

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const value = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
      button.querySelector('span').textContent = 'Copied';
      showToast('Email copied to clipboard');
      window.setTimeout(() => { button.querySelector('span').textContent = 'Copy email'; }, 2500);
    } catch {
      showToast(value);
    }
  });
});

const cursor = document.querySelector('.cursor-label');
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('[data-cursor]').forEach(card => {
    card.addEventListener('mouseenter', () => {
      cursor.textContent = card.dataset.cursor;
      cursor.classList.add('is-visible');
    });
    card.addEventListener('mousemove', event => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    });
    card.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
  });
}

const heroStage = document.querySelector('[data-hero-stage]');
if (heroStage && !prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
  heroStage.addEventListener('pointermove', event => {
    const rect = heroStage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    heroStage.style.transform = `perspective(1400px) rotateX(${y * -1.2}deg) rotateY(${x * 1.2}deg)`;
  });
  heroStage.addEventListener('pointerleave', () => {
    heroStage.style.transform = 'perspective(1400px) rotateX(0) rotateY(0)';
  });
}

const projectFilters = [...document.querySelectorAll('[data-project-filter]')];
const portfolioCards = [...document.querySelectorAll('.portfolio-card[data-category]')];
const projectStatus = document.querySelector('[data-project-status]');
const projectPagination = document.querySelector('[data-project-pagination]');
const projectGrid = document.querySelector('#project-grid');
const projectPageSize = 10;
let activeProjectFilter = 'all';
let activeProjectPage = 1;

function makePageButton(label, page, options = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `pagination-button${options.current ? ' is-current' : ''}${options.direction ? ` is-${options.direction}` : ''}`;
  button.dataset.page = String(page);
  button.setAttribute('aria-label', options.ariaLabel || `Page ${page}`);
  if (options.current) button.setAttribute('aria-current', 'page');
  if (options.disabled) button.disabled = true;
  button.textContent = label;
  button.addEventListener('click', () => {
    activeProjectPage = page;
    updatePortfolioVisibility();
    projectGrid?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  });
  return button;
}

function renderProjectPagination(totalPages) {
  if (!projectPagination) return;
  projectPagination.replaceChildren();
  projectPagination.hidden = totalPages <= 1;
  if (totalPages <= 1) return;

  projectPagination.append(makePageButton('<', Math.max(1, activeProjectPage - 1), {
    ariaLabel: 'Previous project page',
    direction: 'previous',
    disabled: activeProjectPage === 1
  }));
  for (let page = 1; page <= totalPages; page += 1) {
    projectPagination.append(makePageButton(String(page), page, { current: page === activeProjectPage }));
  }
  projectPagination.append(makePageButton('>', Math.min(totalPages, activeProjectPage + 1), {
    ariaLabel: 'Next project page',
    direction: 'next',
    disabled: activeProjectPage === totalPages
  }));
}

function updatePortfolioVisibility() {
  const matchingCards = portfolioCards.filter(card => activeProjectFilter === 'all' || card.dataset.category === activeProjectFilter);
  const totalPages = Math.max(1, Math.ceil(matchingCards.length / projectPageSize));
  activeProjectPage = Math.min(activeProjectPage, totalPages);
  const pageStart = (activeProjectPage - 1) * projectPageSize;
  const pageEnd = Math.min(pageStart + projectPageSize, matchingCards.length);
  portfolioCards.forEach(card => { card.hidden = true; });
  matchingCards.forEach((card, index) => { card.hidden = index < pageStart || index >= pageEnd; });

  if (projectStatus) {
    projectStatus.textContent = matchingCards.length
      ? `Showing ${pageStart + 1} to ${pageEnd} of ${matchingCards.length} projects`
      : 'No projects in this category';
  }
  renderProjectPagination(totalPages);
}

projectFilters.forEach(button => {
  button.addEventListener('click', () => {
    activeProjectFilter = button.dataset.projectFilter;
    activeProjectPage = 1;
    projectFilters.forEach(filter => {
      const isSelected = filter === button;
      filter.classList.toggle('is-active', isSelected);
      filter.setAttribute('aria-pressed', String(isSelected));
    });
    updatePortfolioVisibility();
  });
});
updatePortfolioVisibility();

const pageSections = [...document.querySelectorAll('section[id]')];
const navigationLinks = [...document.querySelectorAll('.desktop-nav a')];
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    const active = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!active) return;
    navigationLinks.forEach(link => link.removeAttribute('aria-current'));
    const current = navigationLinks.find(link => link.getAttribute('href') === `#${active.target.id}`);
    if (current) current.setAttribute('aria-current', 'location');
  }, { rootMargin: '-35% 0px -55%', threshold: [0, .2, .5] });
  pageSections.forEach(section => sectionObserver.observe(section));
}
