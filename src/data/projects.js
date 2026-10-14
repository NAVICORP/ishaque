/*
 * Every project on the site, in the order the "All" view shows them.
 *
 * Case studies mirror skifi.co/case-studies (each one opens its full write-up
 * there); the last few are portfolio pieces that only live on Fiverr.
 * Cards and the quick view are built from this file, so adding a project is
 * one new entry here and nothing else.
 *
 * cover: a path under /public, or a full URL while an image still lives on
 * another CDN.
 */

export const CATEGORIES = [
  "Product design",
  "Pitch decks",
  "Websites",
  "Branding",
  "One-pagers",
  "Brochures",
  "Visual design"
];

export const PROJECTS = [
  {
    "slug": "bullx-trading-terminal",
    "name": "BullX",
    "client": "BullX",
    "headline": "The next-gen multi-chain trading experience",
    "category": "Product design",
    "industry": "Web3 and DeFi",
    "summary": "$20B+ trading volume within 6 months. A decentralized multi-chain trading platform for high-frequency and memecoin traders.",
    "outcome": [
      "$20B+ in trading volume within 6 months",
      "Strong retention and repeat trading behavior",
      "High user engagement on both web and Telegram flows"
    ],
    "cover": "https://framerusercontent.com/images/BYRWavuJz0grGVu7lhUo5ZH1Uk4.png?scale-down-to=1200",
    "href": "https://skifi.co/case-studies/bullx-trading-terminal",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "slug": "the-back-nine-investor-deck",
    "name": "The Back Nine",
    "client": "The Back Nine",
    "headline": "An investor deck for a golf festival",
    "category": "Pitch decks",
    "industry": "Events and entertainment",
    "summary": "A premium immersive golf festival concept, put in front of investors as a visual narrative rather than a document.",
    "outcome": [],
    "cover": "/assets/projects/251605897.webp",
    "href": "https://skifi.co/case-studies/the-back-nine-investor-deck",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-reborn-naturals",
    "name": "Reborn Naturals",
    "client": "Reborn Naturals",
    "headline": "",
    "category": "Websites",
    "industry": "Beauty and haircare",
    "summary": "A storefront for an Ayurvedic haircare brand, built in the same look as the pitch deck we designed for it.",
    "outcome": [
      "One visual language across the deck and the site",
      "The full Kaadha routine and the 15 day challenge on one page",
      "A front end ready to become a Shopify theme"
    ],
    "cover": "https://rebornnaturals.skifi.co/assets/og-image.jpg",
    "href": "https://skifi.co/case-studies/site-reborn-naturals",
    "live": "https://rebornnaturals.skifi.co/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "lenovo-audio-sales-enablement",
    "name": "Lenovo Audio",
    "client": "Lenovo",
    "headline": "A sales deck a rep can actually present from",
    "category": "Pitch decks",
    "industry": "Technology and hardware",
    "summary": "A sales enablement presentation for Lenovo’s Audio Solutions portfolio, built so the team can find the right story fast.",
    "outcome": [],
    "cover": "/assets/projects/251638681.webp",
    "href": "https://skifi.co/case-studies/lenovo-audio-sales-enablement",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "slug": "shuriken-signal-trading",
    "name": "Shuriken",
    "client": "Shuriken",
    "headline": "From social alpha to executed trade, in under 500ms",
    "category": "Product design",
    "industry": "Web3 and DeFi",
    "summary": "A social alpha to trade execution platform for sophisticated on-chain traders, across Solana, Base, BSC and Monad.",
    "outcome": [
      "$200M+ total trading volume in the first 6 months",
      "Under 500ms signal-to-screen latency",
      "4 chains at launch, 60s AI Agent Kit setup"
    ],
    "cover": "https://framerusercontent.com/images/Q1Z4CuztfWzcopDf1PM0LTdVDQ.png?scale-down-to=1200",
    "href": "https://skifi.co/case-studies/shuriken-signal-trading",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "slug": "emondt-kmi-productboek",
    "name": "Emondt KMI",
    "client": "Emondt KMI Fresh Food Interiors",
    "headline": "A 26 page product book a distributor can sell from",
    "category": "Pitch decks",
    "industry": "Refrigeration and retail interiors",
    "summary": "A Dutch product book for custom refrigerated counters, laid out so every model is read the same way.",
    "outcome": [
      "One spread pattern applied across the full range, so models compare directly",
      "Photography, technical drawing and specification on the same page rather than three",
      "A layout the team can extend as products are added, in Dutch and ready for translation"
    ],
    "cover": "/assets/skifi/emondt-kmi.jpg",
    "href": "https://skifi.co/case-studies/emondt-kmi-productboek",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "slug": "coca-cola-adria-presentation",
    "name": "Coca-Cola Adria",
    "client": "Coca-Cola Adria",
    "headline": "A project presentation in brand",
    "category": "Pitch decks",
    "industry": "Consumer brands",
    "summary": "A project presentation designed inside one of the most recognisable brand systems there is.",
    "outcome": [],
    "cover": "/assets/projects/229962441.webp",
    "href": "https://skifi.co/case-studies/coca-cola-adria-presentation",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "slug": "agent-marketplace",
    "name": "Kore.ai Agent Marketplace",
    "client": "Kore.ai",
    "headline": "The PLG front door for enterprise AI",
    "category": "Product design",
    "industry": "AI and enterprise SaaS",
    "summary": "The discovery and deployment layer of the Kore.ai Agent Platform: 200+ agent templates, integrations with 150+ business apps.",
    "outcome": [
      "Multi-day developer configuration collapsed into a guided 15-minute experience",
      "Enterprise teams could self-serve agent deployment without opening a support ticket",
      "The agent card component system was adopted platform-wide"
    ],
    "cover": "https://framerusercontent.com/images/7lDdPh8QmsOTmN14A8jTGKzc28.png?scale-down-to=1200",
    "href": "https://skifi.co/case-studies/agent-marketplace",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-welten-communication",
    "name": "Welten Communication",
    "client": "Welten Communication",
    "headline": "",
    "category": "Websites",
    "industry": "Communications",
    "summary": "A Swiss communications consultancy site, built so the offer is legible before the scroll.",
    "outcome": [
      "The offer stated in the first screen",
      "Services as a scannable list rather than prose",
      "Built to load fast and read well on a phone"
    ],
    "cover": "/assets/websites/welten-communication.jpg",
    "href": "https://skifi.co/case-studies/site-welten-communication",
    "live": "https://weltencommunication.ch/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "cabana-non-alcoholic-beer",
    "name": "Cabana",
    "client": "Cabana",
    "headline": "Pitching a non-alcoholic beer to investors",
    "category": "Pitch decks",
    "industry": "Food and beverage",
    "summary": "A modern non-alcoholic beer brand for wellness-conscious drinkers, pitched as both an investor story and a marketing one.",
    "outcome": [],
    "cover": "/assets/projects/251276761.webp",
    "href": "https://skifi.co/case-studies/cabana-non-alcoholic-beer",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "slug": "gulfbay-logistics-brochure",
    "name": "GulfBay Logistics",
    "client": "GulfBay Logistics",
    "headline": "A dense service portfolio, made readable",
    "category": "Brochures",
    "industry": "Logistics and freight",
    "summary": "A multi-page corporate brochure for a Dubai-based 3PL freight forwarder serving 120+ countries.",
    "outcome": [],
    "cover": "/assets/projects/251496235.webp",
    "href": "https://skifi.co/case-studies/gulfbay-logistics-brochure",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "client": "Value360 Brand System",
    "headline": "",
    "industry": "",
    "outcome": [],
    "live": "",
    "behance": "",
    "nda": false,
    "fiverr": true,
    "slug": "value360-brand-system",
    "name": "Value360 Brand System",
    "category": "Branding",
    "summary": "A logo and design system rebrand.",
    "cover": "/assets/fiverr/value360-brand-system.jpg",
    "href": "https://www.fiverr.com/users/skifidesigns/portfolio"
  },
  {
    "slug": "oway-carrier-partnership",
    "name": "Oway",
    "client": "Oway",
    "headline": "Making freight matching legible to investors",
    "category": "Pitch decks",
    "industry": "Logistics and freight",
    "summary": "A logistics and freight technology company built on intelligent freight matching, explained in one corporate deck.",
    "outcome": [
      "Investor and business-focused storytelling",
      "Custom infographic design and data visualization slides",
      "A modern PowerPoint design system, consistent with the brand"
    ],
    "cover": "/assets/projects/251275263.webp",
    "href": "https://skifi.co/case-studies/oway-carrier-partnership",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "slug": "record-high-pitch-deck",
    "name": "Record High",
    "client": "Record High",
    "headline": "A pitch deck with one job per slide",
    "category": "Pitch decks",
    "industry": "Startups",
    "summary": "An investor pitch deck structured so each slide carries exactly one argument.",
    "outcome": [
      "A deck sequenced the way the questions actually get asked",
      "One argument per slide, with the evidence under it",
      "Charts reduced to the comparison that matters"
    ],
    "cover": "/assets/projects/251851049.webp",
    "href": "https://skifi.co/case-studies/record-high-pitch-deck",
    "live": "",
    "behance": "https://www.behance.net/gallery/251851049/",
    "nda": false
  },
  {
    "slug": "informed-presentation",
    "name": "Informed",
    "client": "Informed",
    "headline": "Dense material, calm pages",
    "category": "Pitch decks",
    "industry": "Data and analytics",
    "summary": "Presentation and infographic design for analytics material that had more to say than a slide usually holds.",
    "outcome": [
      "One chart language applied across the full set",
      "Dense slides made navigable through grid and spacing",
      "Infographic summaries that carry a section on their own"
    ],
    "cover": "/assets/projects/223365563.webp",
    "href": "https://skifi.co/case-studies/informed-presentation",
    "live": "",
    "behance": "https://www.behance.net/gallery/223365563/",
    "nda": false
  },
  {
    "slug": "federal-growth-strategy",
    "name": "PruTech",
    "client": "PruTech",
    "headline": "A federal growth plan a CEO can present",
    "category": "Pitch decks",
    "industry": "Government technology",
    "summary": "A phased federal growth strategy laid out so the plan, the timing and the ask are readable in one pass.",
    "outcome": [
      "Three horizons expressed as one continuous, readable timeline",
      "The ask stated explicitly at the end of each phase",
      "A layout set reusable for the next planning cycle"
    ],
    "cover": "/assets/projects/251389481.webp",
    "href": "https://skifi.co/case-studies/federal-growth-strategy",
    "live": "",
    "behance": "https://www.behance.net/gallery/251389481/",
    "nda": false
  },
  {
    "slug": "minted-dating-app",
    "name": "Minted",
    "client": "Minted",
    "headline": "A consumer app deck with the product in it",
    "category": "Pitch decks",
    "industry": "Consumer apps",
    "summary": "An investor and launch presentation for a dating app, where the product does the talking.",
    "outcome": [
      "Product screens embedded through the narrative rather than in an appendix",
      "A flow a reader can follow without a demo",
      "One deck that serves both a pitch and a launch audience"
    ],
    "cover": "/assets/projects/233718611.webp",
    "href": "https://skifi.co/case-studies/minted-dating-app",
    "live": "",
    "behance": "https://www.behance.net/gallery/233718611/",
    "nda": false
  },
  {
    "slug": "claimlynk-tpa-support",
    "name": "ClaimLynk",
    "client": "ClaimLynk",
    "headline": "Making a claims workflow obvious",
    "category": "Pitch decks",
    "industry": "Insurance and health tech",
    "summary": "A support and services presentation for a third-party administrator, built around the flow of a claim.",
    "outcome": [
      "One end-to-end workflow diagram that anchors the whole deck",
      "Stage slides that zoom in without losing the overview",
      "A reusable process language for the rest of their material"
    ],
    "cover": "/assets/projects/233713657.webp",
    "href": "https://skifi.co/case-studies/claimlynk-tpa-support",
    "live": "",
    "behance": "https://www.behance.net/gallery/233713657/",
    "nda": false
  },
  {
    "slug": "signature-innovation-group",
    "name": "Signature Innovation Group",
    "client": "Signature Innovation Group",
    "headline": "The confidence is in the restraint",
    "category": "Pitch decks",
    "industry": "Investment and advisory",
    "summary": "An investment and advisory presentation designed to look as considered as the offer it describes.",
    "outcome": [
      "A restrained system that reads as considered rather than decorated",
      "Hierarchy carried by type and space instead of effects",
      "Slides that stay legible on a boardroom screen"
    ],
    "cover": "/assets/projects/233719569.webp",
    "href": "https://skifi.co/case-studies/signature-innovation-group",
    "live": "",
    "behance": "https://www.behance.net/gallery/233719569/",
    "nda": false
  },
  {
    "slug": "femc-presentation",
    "name": "FEMC",
    "client": "FEMC",
    "headline": "A corporate deck with a spine",
    "category": "Pitch decks",
    "industry": "Energy and infrastructure",
    "summary": "A corporate presentation rebuilt around a fixed structure, so every future version starts from something.",
    "outcome": [
      "A fixed set of layouts covering every kind of content in the deck",
      "Section openers that make the structure of the argument visible",
      "A file the team can extend without it drifting again"
    ],
    "cover": "/assets/projects/223630889.webp",
    "href": "https://skifi.co/case-studies/femc-presentation",
    "live": "",
    "behance": "https://www.behance.net/gallery/223630889/",
    "nda": false
  },
  {
    "slug": "fat-truck-ruf",
    "name": "Fat Truck RUF",
    "client": "Fat Truck",
    "headline": "A hard product, sold plainly",
    "category": "Pitch decks",
    "industry": "Industrial vehicles",
    "summary": "Presentations and infographics for an all-terrain utility vehicle, where the spec sheet is the sales pitch.",
    "outcome": [
      "Specifications presented on the product rather than in a separate table",
      "Terrain and capability shown as diagrams, in the buyer's terms",
      "One set that works as a sales deck and as a leave-behind"
    ],
    "cover": "/assets/projects/223639385.webp",
    "href": "https://skifi.co/case-studies/fat-truck-ruf",
    "live": "",
    "behance": "https://www.behance.net/gallery/223639385/",
    "nda": false
  },
  {
    "slug": "indigo-value360",
    "name": "IndiGo",
    "client": "IndiGo, through Value360",
    "headline": "A campaign story told in infographics",
    "category": "Pitch decks",
    "industry": "Aviation and PR",
    "summary": "Campaign and coverage slides for India's largest airline, with the numbers drawn rather than tabulated.",
    "outcome": [
      "Campaign performance told through diagrams rather than pasted tables",
      "A consistent chart language across the set, so figures stay comparable slide to slide",
      "Layouts that survive both a projected review and a PDF read on a phone"
    ],
    "cover": "/assets/projects/224117859.webp",
    "href": "https://skifi.co/case-studies/indigo-value360",
    "live": "",
    "behance": "https://www.behance.net/gallery/224117859/",
    "nda": false
  },
  {
    "slug": "verizon-presentation-infographics",
    "name": "Verizon",
    "client": "Verizon",
    "headline": "Enterprise slides that stay readable",
    "category": "Pitch decks",
    "industry": "Telecommunications",
    "summary": "Presentation and infographic design for enterprise telecom material, built to carry detail without losing the point.",
    "outcome": [
      "Technical material laid out as diagrams rather than paragraphs",
      "One accent per slide, so the eye lands where the speaker is",
      "A layout set that holds up at enterprise slide counts"
    ],
    "cover": "/assets/projects/223638239.webp",
    "href": "https://skifi.co/case-studies/verizon-presentation-infographics",
    "live": "",
    "behance": "https://www.behance.net/gallery/223638239/",
    "nda": false
  },
  {
    "slug": "toyota-kirloskar-value360",
    "name": "Toyota Kirloskar",
    "client": "Toyota Kirloskar Motor, through Value360",
    "headline": "An integrated media approach, on slides",
    "category": "Pitch decks",
    "industry": "Automotive and PR",
    "summary": "An agency approach document for Toyota Kirloskar, built so a media plan reads as one argument rather than a stack of tactics.",
    "outcome": [
      "A single approach document covering strategy, media outreach and phasing",
      "Recurring structures drawn as reusable diagrams the team could refill for later rounds",
      "Brand-accurate throughout, so it reads as Toyota's document rather than an agency's"
    ],
    "cover": "/assets/projects/224376693.webp",
    "href": "https://skifi.co/case-studies/toyota-kirloskar-value360",
    "live": "",
    "behance": "https://www.behance.net/gallery/224376693/",
    "nda": false
  },
  {
    "slug": "value360-integrated-creds",
    "name": "Value360",
    "client": "Value360 Communications",
    "headline": "A credentials deck that earns the next meeting",
    "category": "Pitch decks",
    "industry": "Public relations",
    "summary": "Credentials and capability slides for an integrated communications group, designed so the range reads as one offer.",
    "outcome": [
      "Credentials, leadership and service slides unified under one visual system",
      "Modules the team can refill for a specific pitch without redesigning the deck",
      "Infographic treatments in place of the dense text blocks the material started as"
    ],
    "cover": "/assets/projects/223731491.webp",
    "href": "https://skifi.co/case-studies/value360-integrated-creds",
    "live": "",
    "behance": "https://www.behance.net/gallery/223731491/",
    "nda": false
  },
  {
    "slug": "king-abdulaziz-dentistry",
    "name": "Faculty of Dentistry",
    "client": "Faculty of Dentistry, King Abdulaziz University",
    "headline": "An academic deck that holds a room",
    "category": "Pitch decks",
    "industry": "Higher education",
    "summary": "Academic presentation design for a university faculty, built for a lecture hall rather than a laptop.",
    "outcome": [
      "Typography and imagery scaled for a lecture hall",
      "A consistent structure across a long teaching set",
      "Institutional identity applied without stiffness"
    ],
    "cover": "/assets/projects/223647841.webp",
    "href": "https://skifi.co/case-studies/king-abdulaziz-dentistry",
    "live": "",
    "behance": "https://www.behance.net/gallery/223647841/",
    "nda": false
  },
  {
    "slug": "mountain-vista",
    "name": "Mountain Vista",
    "client": "Mountain Vista",
    "headline": "A property story in sequence",
    "category": "Pitch decks",
    "industry": "Real estate",
    "summary": "A property presentation built to move a reader from place to plan to price without losing them.",
    "outcome": [
      "Photography and figures separated so each one works",
      "A sequence that moves from place to plan to price",
      "Commercial slides laid out for trust rather than effect"
    ],
    "cover": "/assets/projects/122735387.webp",
    "href": "https://skifi.co/case-studies/mountain-vista",
    "live": "",
    "behance": "https://www.behance.net/gallery/122735387/",
    "nda": false
  },
  {
    "slug": "reflector-bio-drug-discovery",
    "name": "Reflector Bio",
    "client": "Reflector Bio",
    "headline": "Explaining AI drug discovery to people who fund it",
    "category": "Pitch decks",
    "industry": "Biotech",
    "summary": "A deck about AI-driven drug discovery, built so the science lands with an audience that is not in the lab.",
    "outcome": [
      "The discovery pipeline expressed as one diagram the whole deck refers to",
      "Technical depth kept available without it leading every slide",
      "A layout set the team can extend as the programme moves"
    ],
    "cover": "/assets/fiverr/reflector-bio.jpg",
    "href": "https://skifi.co/case-studies/reflector-bio-drug-discovery",
    "live": "",
    "behance": "https://www.behance.net/gallery/239229737/",
    "nda": false
  },
  {
    "slug": "linkedin-community-presentation",
    "name": "LinkedIn",
    "client": "LinkedIn",
    "headline": "Community data made into a story",
    "category": "Pitch decks",
    "industry": "Social platforms",
    "summary": "A community presentation with the numbers drawn rather than listed, so the findings survive a fast read.",
    "outcome": [
      "Every section leads with a claim and supports it with its data",
      "One chart language across the set, so numbers stay comparable",
      "Infographic summaries that carry a section on their own"
    ],
    "cover": "/assets/fiverr/linkedin-club-navigator.jpg",
    "href": "https://skifi.co/case-studies/linkedin-community-presentation",
    "live": "",
    "behance": "https://www.behance.net/gallery/239228753/",
    "nda": false
  },
  {
    "slug": "hygia-health-deck",
    "name": "Hygia Health",
    "client": "Hygia Health",
    "headline": "A healthcare deck with the patient in it",
    "category": "Pitch decks",
    "industry": "Healthcare",
    "summary": "A healthcare presentation built around the patient journey rather than the org chart.",
    "outcome": [
      "The deck structured around the patient journey, not the org chart",
      "Capabilities shown where they are used rather than in a list",
      "A calm palette and spacing suited to a clinical subject"
    ],
    "cover": "/assets/fiverr/hygiea-health.jpg",
    "href": "https://skifi.co/case-studies/hygia-health-deck",
    "live": "",
    "behance": "https://www.behance.net/gallery/228748827/",
    "nda": false
  },
  {
    "slug": "poco-presentation",
    "name": "POCO",
    "client": "POCO",
    "headline": "A product story at launch pace",
    "category": "Pitch decks",
    "industry": "Consumer electronics",
    "summary": "Launch presentation design for a consumer electronics brand that sells on specification and speed.",
    "outcome": [
      "One hero specification per slide, with the rest in support",
      "Type and contrast tuned for a fast, high-energy read",
      "Brand colour used structurally rather than as decoration"
    ],
    "cover": "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/ce731b219029961.67ab58fac0867.jpg",
    "href": "https://skifi.co/case-studies/poco-presentation",
    "live": "",
    "behance": "https://www.behance.net/gallery/219029961/",
    "nda": false
  },
  {
    "slug": "battery-smart-presentation",
    "name": "Battery Smart",
    "client": "Battery Smart",
    "headline": "A swap network explained in one picture",
    "category": "Pitch decks",
    "industry": "EV infrastructure",
    "summary": "Presentation design for a battery swapping network, where the model is the thing that needs explaining.",
    "outcome": [
      "The swap loop drawn once and used as the deck spine",
      "Economics attached to the mechanics rather than stated apart from them",
      "A diagram the team can reuse outside the deck"
    ],
    "cover": "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/22d869219029365.67ab574a1824b.jpg",
    "href": "https://skifi.co/case-studies/battery-smart-presentation",
    "live": "",
    "behance": "https://www.behance.net/gallery/219029365/",
    "nda": false
  },
  {
    "slug": "fraganote-presentation",
    "name": "Fraganote",
    "client": "Fraganote",
    "headline": "A fragrance brand that reads as one",
    "category": "Pitch decks",
    "industry": "Beauty and fragrance",
    "summary": "Brand presentation design for a fragrance house, where the look is part of the argument.",
    "outcome": [
      "A restrained layout that matches the position being claimed",
      "Product photography given the space to carry a page",
      "Deck and packaging reading as one brand"
    ],
    "cover": "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/4b0e7a219028115.67ab53dc6aafa.jpg",
    "href": "https://skifi.co/case-studies/fraganote-presentation",
    "live": "",
    "behance": "https://www.behance.net/gallery/219028115/",
    "nda": false
  },
  {
    "slug": "healthians-presentation",
    "name": "Healthians",
    "client": "Healthians",
    "headline": "Diagnostics made plain",
    "category": "Pitch decks",
    "industry": "Health diagnostics",
    "summary": "Presentation design for a diagnostics business, with the service explained before the numbers arrive.",
    "outcome": [
      "The service explained before the market figures",
      "A booking-to-result sequence a reader follows in one pass",
      "Figures positioned as evidence rather than as the headline"
    ],
    "cover": "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/206b91219029497.67ab57a7c891b.jpg",
    "href": "https://skifi.co/case-studies/healthians-presentation",
    "live": "",
    "behance": "https://www.behance.net/gallery/219029497/",
    "nda": false
  },
  {
    "slug": "pes-university-presentation",
    "name": "PES University",
    "client": "PES University",
    "headline": "An institution presented to students",
    "category": "Pitch decks",
    "industry": "Higher education",
    "summary": "Institutional presentation design aimed at the people deciding where to study, not at the institution itself.",
    "outcome": [
      "Reordered around what a prospective student asks first",
      "Credentials used as support rather than as the opening",
      "Sized and set for a hall as well as a handout"
    ],
    "cover": "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/068393219028337.67ab54724a4ef.jpg",
    "href": "https://skifi.co/case-studies/pes-university-presentation",
    "live": "",
    "behance": "https://www.behance.net/gallery/219028337/",
    "nda": false
  },
  {
    "slug": "reborn-naturals-growth-financing",
    "name": "Reborn Naturals",
    "client": "Reborn Naturals (Healnatural Pvt. Ltd.)",
    "headline": "A financing deck that earns the next meeting",
    "category": "Pitch decks",
    "industry": "Beauty and wellness",
    "summary": "A structured growth financing proposal for an Indian herbal beauty brand, built so the plan reads before the numbers do.",
    "outcome": [
      "The ask stated up front, with the structure and horizon beside it",
      "Every phase tied to what it funds and what it has to prove first",
      "Product and financial pages reading as one document"
    ],
    "cover": "/assets/skifi/reborn-naturals-deck.jpg",
    "href": "https://skifi.co/case-studies/reborn-naturals-growth-financing",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "client": "Medical Korea 2026",
    "headline": "",
    "industry": "",
    "outcome": [],
    "live": "",
    "behance": "",
    "nda": false,
    "fiverr": true,
    "slug": "medical-korea-2026",
    "name": "Medical Korea 2026",
    "category": "Pitch decks",
    "summary": "A pitch deck for Medical Korea 2026.",
    "cover": "/assets/fiverr/medical-korea.jpg",
    "href": "https://www.fiverr.com/users/skifidesigns/portfolio"
  },
  {
    "client": "Housekeeping Rules",
    "headline": "",
    "industry": "",
    "outcome": [],
    "live": "",
    "behance": "",
    "nda": false,
    "fiverr": true,
    "slug": "housekeeping-rules",
    "name": "Housekeeping Rules",
    "category": "Pitch decks",
    "summary": "A presentation made as a video.",
    "cover": "/assets/fiverr/housekeeping-rules.jpg",
    "href": "https://www.fiverr.com/users/skifidesigns/portfolio"
  },
  {
    "slug": "shuriken-defi-platform",
    "name": "ShurikenTrade",
    "client": "Shuriken",
    "headline": "A DeFi platform built on speed",
    "category": "Product design",
    "industry": "Web3 and DeFi",
    "summary": "Automated sniping, quick swaps and non-custodial trading, designed around speed, efficiency and the trader.",
    "outcome": [],
    "cover": "https://framerusercontent.com/images/zpnbTPASd2ZiE8gQfq8U2njb1FI.jpg?scale-down-to=1200",
    "href": "https://skifi.co/case-studies/shuriken-defi-platform",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "slug": "jirasan-nft-unification",
    "name": "Jirasan",
    "client": "Project Gojira",
    "headline": "Unifying four NFT collections under one brand",
    "category": "Product design",
    "industry": "Web3 and NFT",
    "summary": "Four collections, multiple wallets, and the flows to get every holder to a single place they could act from.",
    "outcome": [
      "4 NFT collections unified",
      "10+ wallets per user supported",
      "One dashboard for all flows"
    ],
    "cover": "https://framerusercontent.com/images/XVBGXPOzZ3ibLgWd10uHqlEQbV8.png?scale-down-to=1200",
    "href": "https://skifi.co/case-studies/jirasan-nft-unification",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "slug": "sensus-community-sentiment",
    "name": "Sensus",
    "client": "Sensus",
    "headline": "",
    "category": "Product design",
    "industry": "Web3, AI and community",
    "summary": "AI-powered community sentiment tracker. Spot concerns and manage your Discord or Telegram community in real time.",
    "outcome": [],
    "cover": "https://framerusercontent.com/images/6azVAnrvf5hWQX8o3xMO45QVlo.png?scale-down-to=1200",
    "href": "https://skifi.co/case-studies/sensus-community-sentiment",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "slug": "magically-nft-analytics",
    "name": "Magically",
    "client": "Magically",
    "headline": "NFT pro analytics marketplace",
    "category": "Product design",
    "industry": "Web3 and NFT",
    "summary": "An intuitive, user-centric UI/UX for the most advanced NFT marketplace with a 0% trading fee.",
    "outcome": [],
    "cover": "https://framerusercontent.com/images/uOeAOm5YGA41IqjjCI1Pf4nolI.jpg?scale-down-to=1200",
    "href": "https://skifi.co/case-studies/magically-nft-analytics",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "slug": "scratch-card-rewards",
    "name": "Cruffin and Daahogh",
    "client": "Cruffin and Daahogh",
    "headline": "Enhancing reputation and sales through incentivized reviews",
    "category": "Product design",
    "industry": "Food and delivery",
    "summary": "A scratch card incentive system, designed as a seamless flow that encourages customers to leave a review on Zomato.",
    "outcome": [],
    "cover": "https://framerusercontent.com/images/Sdn8DczWXaKcKX3S4kasloERTs.jpg?scale-down-to=1200",
    "href": "https://skifi.co/case-studies/scratch-card-rewards",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "slug": "kore-agent-platform",
    "name": "Kore.ai Agent Platform",
    "client": "Kore.ai",
    "headline": "",
    "category": "Product design",
    "industry": "AI and enterprise SaaS",
    "summary": "Redesigning agent onboarding for a PLG journey. Unify fragmented agentic AI efforts throughout the enterprise with a single agent platform. Publishing soon.",
    "outcome": [],
    "cover": "https://framerusercontent.com/images/fdeNYjuPG8Mx02DtdbHnDySgw1M.png?scale-down-to=1200",
    "href": "https://skifi.co/case-studies/kore-agent-platform",
    "live": "",
    "behance": "",
    "nda": true
  },
  {
    "slug": "dreamerz",
    "name": "Dreamerz",
    "client": "",
    "headline": "",
    "category": "Product design",
    "industry": "Web3 and gaming",
    "summary": "NFT fantasy game.",
    "outcome": [],
    "cover": "https://framerusercontent.com/images/Tk0ov4hy1kwb9GRioJK9rSXQrbY.jpg?scale-down-to=1200",
    "href": "https://skifi.co/case-studies/dreamerz",
    "live": "",
    "behance": "",
    "nda": true
  },
  {
    "slug": "swipoor",
    "name": "Swipoor",
    "client": "",
    "headline": "",
    "category": "Product design",
    "industry": "Web3 and gaming",
    "summary": "NFT prediction game.",
    "outcome": [],
    "cover": "https://framerusercontent.com/images/Yr2U1o2OdkJClKKyaqgkzAeaU.jpg?scale-down-to=1200",
    "href": "https://skifi.co/case-studies/swipoor",
    "live": "",
    "behance": "",
    "nda": true
  },
  {
    "slug": "cruffin-delivery-app",
    "name": "Cruffin",
    "client": "",
    "headline": "",
    "category": "Product design",
    "industry": "Food and delivery",
    "summary": "Delivery app for cakes and bakery.",
    "outcome": [],
    "cover": "https://framerusercontent.com/images/29IduhIwlTwh0lJU9RQOnYNiVv0.jpg?scale-down-to=1200",
    "href": "https://skifi.co/case-studies/cruffin-delivery-app",
    "live": "",
    "behance": "",
    "nda": true
  },
  {
    "slug": "cloud-kitchen-pos",
    "name": "Mohi POS",
    "client": "Mohi",
    "headline": "",
    "category": "Product design",
    "industry": "Food and delivery",
    "summary": "Best POS managing software for cloud kitchen.",
    "outcome": [],
    "cover": "https://framerusercontent.com/images/2P66zlkJsRjFG8FsO1evW4NrQtw.jpg?scale-down-to=1200",
    "href": "https://skifi.co/case-studies/cloud-kitchen-pos",
    "live": "",
    "behance": "",
    "nda": true
  },
  {
    "slug": "site-insync-international",
    "name": "Insync International",
    "client": "Insync International",
    "headline": "",
    "category": "Websites",
    "industry": "Business services",
    "summary": "A corporate site for an international services firm, structured around what a client is looking for.",
    "outcome": [
      "Navigation organised by client need",
      "One consistent next step at the end of every page",
      "A structure the team can extend without redesigning it"
    ],
    "cover": "/assets/websites/insync.jpg",
    "href": "https://skifi.co/case-studies/site-insync-international",
    "live": "https://insync.skifi.co/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-modern-data-advisor",
    "name": "Modern Data Advisor",
    "client": "Modern Data Advisor",
    "headline": "",
    "category": "Websites",
    "industry": "Data consulting",
    "summary": "A consulting site for a data advisory practice, kept plain on purpose.",
    "outcome": [
      "Engagement structure made the spine of the site",
      "A visual language built from type and space rather than stock imagery",
      "Pages short enough to be read rather than skimmed"
    ],
    "cover": "/assets/websites/modern-data-advisor.jpg",
    "href": "https://skifi.co/case-studies/site-modern-data-advisor",
    "live": "https://moderndataadvisor.skifi.co/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-km-fancy-gold",
    "name": "KM Fancy Gold",
    "client": "KM Fancy Gold",
    "headline": "",
    "category": "Websites",
    "industry": "Jewellery retail",
    "summary": "An online storefront for a jewellery house, where the product photography has to carry the page.",
    "outcome": [
      "Product photography given the size it needs",
      "Browsing organised the way customers ask for pieces",
      "An interface that recedes behind the product"
    ],
    "cover": "/assets/websites/km-fancy-gold.jpg",
    "href": "https://skifi.co/case-studies/site-km-fancy-gold",
    "live": "https://kmfancygold.skifi.co/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-hampick",
    "name": "Hampick",
    "client": "Hampick",
    "headline": "",
    "category": "Websites",
    "industry": "Consumer",
    "summary": "A consumer brand site built to move a visitor from curiosity to an action in one screen.",
    "outcome": [
      "The reason to care in the first screen",
      "One action, repeated where a reader pauses",
      "Built mobile first, where most of the traffic is"
    ],
    "cover": "/assets/websites/hampick.jpg",
    "href": "https://skifi.co/case-studies/site-hampick",
    "live": "https://hampick.com/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-idrop-digital",
    "name": "iDrop Digital",
    "client": "iDrop Digital",
    "headline": "",
    "category": "Websites",
    "industry": "Digital agency",
    "summary": "An agency site where the work does the arguing.",
    "outcome": [
      "Work placed first and given the space",
      "Process compressed to what a prospect actually asks",
      "A neutral frame so the projects carry the page"
    ],
    "cover": "/assets/websites/idrop-digital.jpg",
    "href": "https://skifi.co/case-studies/site-idrop-digital",
    "live": "https://idropdigital.com/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-ishaque-nv",
    "name": "Ishaque Nv.",
    "client": "Ishaque Nv.",
    "headline": "",
    "category": "Websites",
    "industry": "Portfolio",
    "summary": "A personal portfolio built as a list you can scan rather than a gallery you have to swim through.",
    "outcome": [
      "Sixty projects presented as a scannable index",
      "Sorted by kind, so a category is reached directly",
      "Images loaded on demand rather than all at once"
    ],
    "cover": "/assets/websites/ishaque-nv.jpg",
    "href": "https://skifi.co/case-studies/site-ishaque-nv",
    "live": "https://ishaquenv.com/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-skifi-designs",
    "name": "SkiFi Designs",
    "client": "SkiFi Designs",
    "headline": "",
    "category": "Websites",
    "industry": "Design agency",
    "summary": "The agency site behind the Fiverr presence, built to be the place a client lands rather than a profile page.",
    "outcome": [
      "Proof placed before the pitch",
      "The studio’s credibility held on its own domain",
      "A clear path from landing to enquiry"
    ],
    "cover": "/assets/websites/skifi-designs.jpg",
    "href": "https://skifi.co/case-studies/site-skifi-designs",
    "live": "https://skifidesigns.com/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-alfouz-online-academy",
    "name": "Alfouz Online Academy",
    "client": "Alfouz Online Academy",
    "headline": "",
    "category": "Websites",
    "industry": "Education",
    "summary": "An online academy site built around enrolling rather than around describing.",
    "outcome": [
      "Courses given the front page",
      "What, who and how to join, in a fixed order",
      "Enrolment reachable from anywhere on the page"
    ],
    "cover": "/assets/websites/alfouz-online-academy.jpg",
    "href": "https://skifi.co/case-studies/site-alfouz-online-academy",
    "live": "https://alfouzonlineacademy.com/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-world-touch-freight-forwarder",
    "name": "World Touch Freight Forwarder",
    "client": "World Touch Freight Forwarder",
    "headline": "",
    "category": "Websites",
    "industry": "Logistics",
    "summary": "A freight forwarding site that answers the routing and service questions first.",
    "outcome": [
      "Services and coverage laid out as a checkable matrix",
      "Contact attached to each service rather than isolated",
      "Company background moved behind the answers"
    ],
    "cover": "/assets/websites/world-touch-com.jpg",
    "href": "https://skifi.co/case-studies/site-world-touch-freight-forwarder",
    "live": "https://worldtouchfreightforwarder.com/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-punarjani-centre-for-women",
    "name": "Punarjani Centre for Women",
    "client": "Punarjani Centre for Women",
    "headline": "",
    "category": "Websites",
    "industry": "Nonprofit",
    "summary": "A site for a women’s centre, built to be useful to the people it serves as well as to donors.",
    "outcome": [
      "Two clear paths from the first screen",
      "Service information written for the person who needs it",
      "Programme and funding detail kept on its own path"
    ],
    "cover": "/assets/websites/punarjani.jpg",
    "href": "https://skifi.co/case-studies/site-punarjani-centre-for-women",
    "live": "https://punarjanicentreforwomen.in/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-kolkata-public-play-school",
    "name": "Kolkata Public Play School",
    "client": "Kolkata Public Play School",
    "headline": "",
    "category": "Websites",
    "industry": "Education",
    "summary": "A play school site aimed squarely at a parent deciding where to send a small child.",
    "outcome": [
      "Ages, the daily routine and how to visit answered first",
      "Notices kept, on a page of their own",
      "Written for a parent rather than for the school"
    ],
    "cover": "/assets/websites/kolkata-public-school.jpg",
    "href": "https://skifi.co/case-studies/site-kolkata-public-play-school",
    "live": "https://kolkatapublicschool.in/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-alif-foundation",
    "name": "Alif Foundation",
    "client": "Alif Foundation",
    "headline": "",
    "category": "Websites",
    "industry": "Nonprofit",
    "summary": "A foundation site that shows the work before it asks for anything.",
    "outcome": [
      "Programmes placed before the organisation",
      "Each programme stating what it does and who it reaches",
      "The ask positioned at the end of the evidence"
    ],
    "cover": "/assets/websites/alif-foundation.jpg",
    "href": "https://skifi.co/case-studies/site-alif-foundation",
    "live": "https://aliffoundation.in/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-glocal-media",
    "name": "Glocal Media",
    "client": "Glocal Media",
    "headline": "",
    "category": "Websites",
    "industry": "Media",
    "summary": "A media organisation site where the publishing, not the brand, is the front page.",
    "outcome": [
      "Output on the front page, organisation one click away",
      "A hierarchy built for long-form on a small screen",
      "Fast to load on the connections the audience has"
    ],
    "cover": "/assets/websites/glocal-media.jpg",
    "href": "https://skifi.co/case-studies/site-glocal-media",
    "live": "https://glocalmedia.org/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-confido-travels",
    "name": "Confido Travels",
    "client": "Confido Travels",
    "headline": "",
    "category": "Websites",
    "industry": "Travel",
    "summary": "A travel company site built around packages a visitor can compare.",
    "outcome": [
      "A single package pattern that makes comparison possible",
      "Inclusions listed in a fixed order every time",
      "Enquiry attached to each package"
    ],
    "cover": "/assets/websites/confido-travels.jpg",
    "href": "https://skifi.co/case-studies/site-confido-travels",
    "live": "https://confidotravels.com/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-our-heritage-foundation",
    "name": "Our Heritage Foundation",
    "client": "Our Heritage Foundation",
    "headline": "",
    "category": "Websites",
    "industry": "Heritage and culture",
    "summary": "A heritage foundation site that treats the archive as the point.",
    "outcome": [
      "The collection browsable from the front page",
      "A page per item rather than a list of files",
      "Institutional copy kept brief and secondary"
    ],
    "cover": "/assets/websites/our-heritage-foundation.jpg",
    "href": "https://skifi.co/case-studies/site-our-heritage-foundation",
    "live": "https://ourheritagefoundation.in/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-st-vrain-creek-environmental-flow-surveys",
    "name": "St. Vrain Creek Environmental Flow Surveys",
    "client": "St. Vrain Creek Environmental Flow Surveys",
    "headline": "",
    "category": "Websites",
    "industry": "Environmental science",
    "summary": "A site for a creek flow survey programme, built so field data and public explanation live together.",
    "outcome": [
      "Plain explanation and survey material kept on separate paths",
      "Survey documents given a proper home rather than a link dump",
      "Readable on a phone in the field"
    ],
    "cover": "/assets/websites/svlhm-env.png",
    "href": "https://skifi.co/case-studies/site-st-vrain-creek-environmental-flow-surveys",
    "live": "https://www.svlhmenv.com/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-markaz-mazra",
    "name": "Markaz Mazra",
    "client": "Markaz Mazra",
    "headline": "",
    "category": "Websites",
    "industry": "Dairy and delivery",
    "summary": "A milk delivery service for a knowledge city campus, with the subscription and the account in one place.",
    "outcome": [
      "Subscription and customer sign-in on one site",
      "Every delivery, return and payment visible to the customer",
      "Built for a campus and its immediate neighbourhood"
    ],
    "cover": "/assets/websites/mazra.png",
    "href": "https://skifi.co/case-studies/site-markaz-mazra",
    "live": "https://mazra.skifi.co/",
    "behance": "",
    "nda": false
  },
  {
    "slug": "site-boys-town-blathur",
    "name": "Boys Town Blathur",
    "client": "Boys Town Blathur",
    "headline": "",
    "category": "Websites",
    "industry": "Community",
    "summary": "A site for a neighbourhood crew in Kerala, built for the people in it.",
    "outcome": [
      "Members, fixtures and history in one place",
      "Built to need almost no upkeep",
      "Fast on a phone, which is where it is read"
    ],
    "cover": "/assets/websites/boystown.png",
    "href": "https://skifi.co/case-studies/site-boys-town-blathur",
    "live": "https://boystown.skifi.co/",
    "behance": "",
    "nda": false
  },
  {
    "client": "Visionmark",
    "headline": "",
    "industry": "",
    "outcome": [],
    "live": "",
    "behance": "",
    "nda": false,
    "fiverr": true,
    "slug": "visionmark-branding",
    "name": "Visionmark",
    "category": "Branding",
    "summary": "Branding and logo design.",
    "cover": "/assets/fiverr/visionmark-branding.jpg",
    "href": "https://www.fiverr.com/users/skifidesigns/portfolio"
  },
  {
    "slug": "ai-enhanced-workflow",
    "name": "AI-Enhanced Workflow",
    "client": "Confidential",
    "headline": "A healthcare one-pager that has one page to work in",
    "category": "One-pagers",
    "industry": "Healthcare technology",
    "summary": "A single page explaining an AI-assisted clinical workflow, for a reader who will give it a minute.",
    "outcome": [
      "A single page built around one workflow diagram",
      "Claim, sequence and proof in a fixed reading order",
      "Sized to stay legible printed and on a phone"
    ],
    "cover": "/assets/projects/251610163.webp",
    "href": "https://skifi.co/case-studies/ai-enhanced-workflow",
    "live": "",
    "behance": "https://www.behance.net/gallery/251610163/AI-Enhanced-Workflow-Healthcare-One-Pager-Design",
    "nda": false
  },
  {
    "slug": "micromem-case-study",
    "name": "MicroMem",
    "client": "MicroMem",
    "headline": "An enterprise case study on one page",
    "category": "One-pagers",
    "industry": "Enterprise technology",
    "summary": "A one-page enterprise case study with the result where the eye lands first.",
    "outcome": [
      "The outcome given the top of the page and the largest type",
      "A repeatable one-page structure for the next case study",
      "Designed to work as a leave-behind and an email attachment"
    ],
    "cover": "/assets/projects/251609019.webp",
    "href": "https://skifi.co/case-studies/micromem-case-study",
    "live": "",
    "behance": "https://www.behance.net/gallery/251609019/MicroMem-Case-Study-Enterprise-Solution-One-Pager",
    "nda": false
  },
  {
    "slug": "mioprox",
    "name": "Mioprox",
    "client": "Template",
    "headline": "A one-pager template built to be refilled",
    "category": "One-pagers",
    "industry": "Templates",
    "summary": "A one-pager template designed so the layout survives whatever content is dropped into it.",
    "outcome": [
      "Zones that hold their shape as the copy changes",
      "Two colourways supplied rather than one to recolour",
      "Built for somebody who is not a designer to fill in"
    ],
    "cover": "/assets/projects/251608613.webp",
    "href": "https://skifi.co/case-studies/mioprox",
    "live": "",
    "behance": "https://www.behance.net/gallery/251608613/One-Pager-Template-for-Mioprox",
    "nda": false
  },
  {
    "slug": "the-secret-business-solution",
    "name": "The Secret Business Solution",
    "client": "Template",
    "headline": "A one-pager template in two colourways",
    "category": "One-pagers",
    "industry": "Templates",
    "summary": "A corporate one-pager template, supplied in two colourways and built to stay tidy when refilled.",
    "outcome": [
      "A fixed share of the page for each block",
      "Two colourways, so the template is picked rather than rebuilt",
      "Holds its shape as services and names are added"
    ],
    "cover": "/assets/projects/251608801.webp",
    "href": "https://skifi.co/case-studies/the-secret-business-solution",
    "live": "",
    "behance": "https://www.behance.net/gallery/251608801/The-Secret-Business-Solution-One-Pager-Template",
    "nda": false
  },
  {
    "slug": "caresyntax-integration-guide",
    "name": "Caresyntax",
    "client": "Caresyntax",
    "headline": "A technical guide people can navigate",
    "category": "Brochures",
    "industry": "Healthcare technology",
    "summary": "A technical integration guide for a digital surgery platform, written for healthcare organisations and technology partners.",
    "outcome": [],
    "cover": "/assets/projects/251611039.webp",
    "href": "https://skifi.co/case-studies/caresyntax-integration-guide",
    "live": "",
    "behance": "",
    "nda": false
  },
  {
    "slug": "home-service-pro-guides",
    "name": "Home Service Pro",
    "client": "Home Service Pro",
    "headline": "A training workbook people actually fill in",
    "category": "Brochures",
    "industry": "Trades and training",
    "summary": "A training workbook for home service professionals, designed for a reader who is holding a pen.",
    "outcome": [
      "Reference and exercise pages treated differently throughout",
      "Section colour giving position in the programme at a glance",
      "Laid out for print, with room to write on every exercise page"
    ],
    "cover": "/assets/projects/251609775.webp",
    "href": "https://skifi.co/case-studies/home-service-pro-guides",
    "live": "",
    "behance": "https://www.behance.net/gallery/251609775/Home-Service-Pro-Guides-Training-Workbook-Design",
    "nda": false
  },
  {
    "slug": "visual-stories",
    "name": "Visual Stories",
    "client": "SkiFi Designs",
    "headline": "A poster set with one voice",
    "category": "Visual design",
    "industry": "Visual design",
    "summary": "A collection of posters and flyers made as one set rather than as one-offs.",
    "outcome": [
      "A shared type and composition system across the set",
      "Each piece still able to stand on its own",
      "Sized and set for print and for social at once"
    ],
    "cover": "/assets/projects/251445443.webp",
    "href": "https://skifi.co/case-studies/visual-stories",
    "live": "",
    "behance": "https://www.behance.net/gallery/251445443/Visual-Stories-Poster-Flyer-Collection",
    "nda": false
  },
  {
    "slug": "portugal-fan-posters",
    "name": "Portugal fan posters",
    "client": "Personal work",
    "headline": "A supporter set",
    "category": "Visual design",
    "industry": "Sports and culture",
    "summary": "A fan poster collection built on the colour and the type, not on the photography.",
    "outcome": [
      "A recognisable set built without licensed photography",
      "Colour and type carrying the identification",
      "Three ingredients rearranged into a coherent series"
    ],
    "cover": "/assets/projects/251445881.webp",
    "href": "https://skifi.co/case-studies/portugal-fan-posters",
    "live": "",
    "behance": "https://www.behance.net/gallery/251445881/Portugal-Fan-Poster-Collection",
    "nda": false
  },
  {
    "slug": "al-fiqh",
    "name": "Al Fiqh",
    "client": "Al Fiqh",
    "headline": "A book cover for a serious subject",
    "category": "Visual design",
    "industry": "Publishing",
    "summary": "A book cover for an Islamic jurisprudence title, where restraint is the whole design brief.",
    "outcome": [
      "Arabic and Latin type balanced rather than stacked",
      "Ornament used structurally, in one place",
      "A cover that reads at thumbnail size and in the hand"
    ],
    "cover": "/assets/projects/251807721.webp",
    "href": "https://skifi.co/case-studies/al-fiqh",
    "live": "",
    "behance": "https://www.behance.net/gallery/251807721/Al-Fiqh-Book-Cover-Design",
    "nda": false
  }
];
