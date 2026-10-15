/*
 * The swipeable deck in "Work that did its job" on the homepage: one card per
 * kind of work, in order. Each card opens the projects page on that filter.
 *   cover: the slug of the project whose cover fronts the card
 *   stat:  optional, a number worth leading with
 *   line:  shown when there is no stat
 *   about: the line beside the deck while the card is in front
 */
export const FEATURED = [
  {
    category: 'Product design',
    cover: 'bullx-trading-terminal',
    stat: { value: '$20B+', label: 'traded on BullX in its first 6 months' },
    about: 'Trading platforms, AI agents and dashboards for BullX, Shuriken and Kore.ai.',
  },
  {
    category: 'Pitch decks',
    cover: 'coca-cola-adria-presentation',
    stat: { value: '$300M+', label: 'raised by clients with decks I designed' },
    about: 'Investor, sales and company decks for Lenovo, Coca-Cola Adria, The Back Nine and many more.',
  },
  {
    category: 'Websites',
    cover: 'site-welten-communication',
    line: 'Designed and built in-house, from the first sketch to launch',
    about: 'Sites for Reborn Naturals, Welten Communication, Insync International and more.',
  },
  {
    category: 'Branding',
    cover: 'value360-brand-system',
    line: 'Logos, colours and type that hold together',
    about: 'Brand systems for Value360 and Visionmark.',
  },
  {
    category: 'Brochures',
    cover: 'gulfbay-logistics-brochure',
    line: 'Brochures and guides people actually read',
    about: 'Print and PDF work for GulfBay Logistics, Caresyntax and Home Service Pro.',
  },
];
