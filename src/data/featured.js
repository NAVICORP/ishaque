/*
 * The box of cards in "Work that did its job" on the homepage: one card per
 * kind of work, left to right. Each card opens the projects page on that
 * filter. The list under the box shows the same cards with their clients.
 *   from/to: the card's gradient
 *   icon:    a key in ICONS in src/render.js
 *   stat:    the big number on the card, with a short label
 *   clients: the line under the card's name in the list
 */
export const FEATURED = [
  { category: 'Product design', from: '#4f7cff', to: '#8a5cf6', icon: 'app', stat: '$20B+', label: 'traded on BullX', clients: 'BullX, Shuriken, Kore.ai' },
  { category: 'Pitch decks', from: '#ff8a5c', to: '#e5413a', icon: 'deck', stat: '$300M+', label: 'raised by clients', clients: 'Lenovo, Coca-Cola Adria, The Back Nine' },
  { category: 'Websites', from: '#22c1ad', to: '#2b8a5c', icon: 'globe', stat: '20', label: 'sites built', clients: 'Reborn Naturals, Welten, Insync' },
  { category: 'Branding', from: '#f9bf3b', to: '#f0703f', icon: 'pen', stat: '2', label: 'brand systems', clients: 'Value360, Visionmark' },
  { category: 'Brochures', from: '#b07a4a', to: '#6b3f22', icon: 'book', stat: '3', label: 'print and PDF', clients: 'GulfBay, Caresyntax, Home Service Pro' },
];
