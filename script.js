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
