/**
 * Utility to semantically map resource titles to icon assets in:
 * - `/icons/processed/` (existing curated icons)
 * - `/icons/generated/` (custom matched icons)
 *
 * Strict Rules:
 * 1. 1st preference: Existing relevant icon.
 * 2. 2nd preference: Available existing alternative.
 * 3. 3rd preference: Generated custom icon if needed.
 * 4. Maintain 100% Uniqueness: Every resource within a product's Kit Includes list
 *    must have a unique resource icon (no duplicates within any product).
 * 5. Tick.png remains universal checkmark and is never overwritten or assigned here.
 */

export interface IconMeta {
  name: string;
  type: 'existing' | 'generated';
  subpath: string;
  reason: string;
}

export const KIT_ICONS: Record<string, IconMeta> = {
  // Existing Icons (/icons/processed/)
  BANK: { name: 'Bank.png', type: 'existing', subpath: 'icons/processed/Bank.png', reason: 'Banking, loans, subsidies, and government financing' },
  BOOK: { name: 'Book.png', type: 'existing', subpath: 'icons/processed/Book.png', reason: 'Comprehensive guide, playbook, handbook, or blueprint' },
  CALENDAR: { name: 'Calender.png', type: 'existing', subpath: 'icons/processed/Calender.png', reason: 'Calendar schedules, timelines, and 30/90-day plans' },
  CHART: { name: 'Chart.png', type: 'existing', subpath: 'icons/processed/Chart.png', reason: 'Financial models, projections, charts, and metrics' },
  CHECKLIST: { name: 'checklist.png', type: 'existing', subpath: 'icons/processed/checklist.png', reason: 'Checklists, action items, and verification steps' },
  CHIP: { name: 'Chip.png', type: 'existing', subpath: 'icons/processed/Chip.png', reason: 'Hardware, microchips, electronics, and technical specs' },
  CLOCK: { name: 'Clock.png', type: 'existing', subpath: 'icons/processed/Clock.png', reason: 'Time management, operating hours, speed, and daily routines' },
  CLOUD: { name: 'Cloud.png', type: 'existing', subpath: 'icons/processed/Cloud.png', reason: 'Cloud software, digital platforms, and online storage' },
  CUBE: { name: 'Cube.png', type: 'existing', subpath: 'icons/processed/Cube.png', reason: 'Product modules, kits, and physical components' },
  CUSTOMER_SERVICE: { name: 'Customer service.png', type: 'existing', subpath: 'icons/processed/Customer service.png', reason: 'Customer service, support, and helpdesk setup' },
  DOCUMENT: { name: 'Document.png', type: 'existing', subpath: 'icons/processed/Document.png', reason: 'Official documentation, legal agreements, and templates' },
  DOWNLOAD: { name: 'Download.png', type: 'existing', subpath: 'icons/processed/Download.png', reason: 'Downloadable templates, tools, and digital files' },
  GLOBE: { name: 'Globe.png', type: 'existing', subpath: 'icons/processed/Globe.png', reason: 'Global business, international clients, export, and cross-border trade' },
  GROWTH: { name: 'Growth.png', type: 'existing', subpath: 'icons/processed/Growth.png', reason: 'Business growth, scaling frameworks, and market expansion' },
  GROWTH_COPY: { name: 'Growth copy.png', type: 'existing', subpath: 'icons/processed/Growth copy.png', reason: 'Alternative growth milestone and acceleration' },
  LAYERS: { name: 'Layers.png', type: 'existing', subpath: 'icons/processed/Layers.png', reason: 'Layered architectures, multi-tier packages, and service bundles' },
  LINK: { name: 'link.png', type: 'existing', subpath: 'icons/processed/link.png', reason: 'Integrations, API connections, and external links' },
  LOCATION: { name: 'Location.png', type: 'existing', subpath: 'icons/processed/Location.png', reason: 'Site selection, geographical location, and store premises' },
  LOCK: { name: 'Lock.png', type: 'existing', subpath: 'icons/processed/Lock.png', reason: 'Security, privacy, confidentiality, and NDAs' },
  NOTIFICATION: { name: 'Notification.png', type: 'existing', subpath: 'icons/processed/Notification.png', reason: 'Notifications, messaging alerts, and push updates' },
  PEOPLE: { name: 'people.png', type: 'existing', subpath: 'icons/processed/people.png', reason: 'Customer profiles, consumer personas, and audience targeting' },
  PERCENTAGE: { name: 'Percentage.png', type: 'existing', subpath: 'icons/processed/Percentage.png', reason: 'Profit margins, unit economics, discounts, and commission rates' },
  PHONE: { name: 'Phone.png', type: 'existing', subpath: 'icons/processed/Phone.png', reason: 'WhatsApp sales funnels, calling scripts, and mobile communications' },
  PIE: { name: 'Pie.png', type: 'existing', subpath: 'icons/processed/Pie.png', reason: 'Market share, budget breakdown, and pie chart analytics' },
  RECYCLE: { name: 'Recycle.png', type: 'existing', subpath: 'icons/processed/Recycle.png', reason: 'Sustainability, recycling, eco-friendly practices, and waste management' },
  SETTINGS: { name: 'Settings.png', type: 'existing', subpath: 'icons/processed/Settings.png', reason: 'Operations setup, workflows, SOPs, and system configuration' },
  STAIRS: { name: 'Stairs.png', type: 'existing', subpath: 'icons/processed/Stairs.png', reason: 'Step-by-step milestones, tier escalation, and growth stages' },
  STAR: { name: 'Star.png', type: 'existing', subpath: 'icons/processed/Star.png', reason: 'Quality standards, ratings, reviews, and premium reputation' },

  // Generated Custom Icons (/icons/generated/)
  ROCKET: { name: 'Rocket.png', type: 'generated', subpath: 'icons/generated/Rocket.png', reason: 'India launch blueprint, fast takeoff, and startup launch plans' },
  TARGET: { name: 'Target.png', type: 'generated', subpath: 'icons/generated/Target.png', reason: 'Market validation, target customer segments, and strategic focus' },
  MEGAPHONE: { name: 'Megaphone.png', type: 'generated', subpath: 'icons/generated/Megaphone.png', reason: 'Marketing playbooks, advertising campaigns, and public promotion' },
  TROPHY: { name: 'Trophy.png', type: 'generated', subpath: 'icons/generated/Trophy.png', reason: 'Success stories, case studies, and winning case benchmarks' },
  SHIELD: { name: 'Shield.png', type: 'generated', subpath: 'icons/generated/Shield.png', reason: 'Risk mitigation, safety protocols, and warranty guarantees' },
  LIGHTBULB: { name: 'Lightbulb.png', type: 'generated', subpath: 'icons/generated/Lightbulb.png', reason: 'Creative content ideas, innovation, and strategic ideation' },
  TAG: { name: 'Tag.png', type: 'generated', subpath: 'icons/generated/Tag.png', reason: 'Pricing formulas, price tags, and promotional discounts' },
  BRIEFCASE: { name: 'Briefcase.png', type: 'generated', subpath: 'icons/generated/Briefcase.png', reason: 'B2B sales strategy, corporate clients, and commercial contracts' },
  USER_PLUS: { name: 'UserPlus.png', type: 'generated', subpath: 'icons/generated/UserPlus.png', reason: 'Hiring roadmap, recruitment, staff onboarding, and team scaling' },
  TRUCK: { name: 'Truck.png', type: 'generated', subpath: 'icons/generated/Truck.png', reason: 'Logistics, delivery systems, freight, and product shipping' },
  INVOICE: { name: 'Invoice.png', type: 'generated', subpath: 'icons/generated/Invoice.png', reason: 'Invoicing requirements, GST billing, and international accounting' },
  WALLET: { name: 'Wallet.png', type: 'generated', subpath: 'icons/generated/Wallet.png', reason: 'Direct wire transfers, payment gateways (Wise, Stripe, PayPal), and cash payouts' },
  VIDEO: { name: 'Video.png', type: 'generated', subpath: 'icons/generated/Video.png', reason: 'Video production, YouTube shorts, reels, and video storytelling' },
  CAMERA: { name: 'Camera.png', type: 'generated', subpath: 'icons/generated/Camera.png', reason: 'Product photography, visual styling, and catalog photography' },
  HEART: { name: 'Heart.png', type: 'generated', subpath: 'icons/generated/Heart.png', reason: 'Customer retention, brand loyalty, and repeat buyer trust cycles' },
  COMPASS: { name: 'Compass.png', type: 'generated', subpath: 'icons/generated/Compass.png', reason: 'Future expansion roadmap, long-term vision, and strategic direction' },
  WRENCH: { name: 'Wrench.png', type: 'generated', subpath: 'icons/generated/Wrench.png', reason: 'Machinery maintenance, technical tooling, and equipment setup' },
  BALANCE: { name: 'Balance.png', type: 'generated', subpath: 'icons/generated/Balance.png', reason: 'Labour laws, factory licenses, and statutory compliance' },
  STORE: { name: 'Store.png', type: 'generated', subpath: 'icons/generated/Store.png', reason: 'Franchise opportunities, retail storefronts, and commercial physical outlets' },
  MAIL: { name: 'Mail.png', type: 'generated', subpath: 'icons/generated/Mail.png', reason: 'Email outreach sequences, cold newsletters, and written communications' },
  AWARD: { name: 'Award.png', type: 'generated', subpath: 'icons/generated/Award.png', reason: 'Accreditations, FSSAI registrations, and government certifications' },
  ALERT: { name: 'Alert.png', type: 'generated', subpath: 'icons/generated/Alert.png', reason: 'Top mistakes to avoid, fatal pitfalls, and warning guidance' },
  SEARCH: { name: 'Search.png', type: 'generated', subpath: 'icons/generated/Search.png', reason: 'Market research, supplier scouting, and product finders' },
  CODE: { name: 'Code.png', type: 'generated', subpath: 'icons/generated/Code.png', reason: 'AI automation workflows, technical code, and digital algorithms' },
  FLAG: { name: 'Flag.png', type: 'generated', subpath: 'icons/generated/Flag.png', reason: 'Milestone tracking, stage deliverables, and progress markers' },
  BOX_OPEN: { name: 'BoxOpen.png', type: 'generated', subpath: 'icons/generated/BoxOpen.png', reason: 'Packaging materials, unboxing experience, and raw material sourcing' },
  SPREADSHEET: { name: 'Spreadsheet.png', type: 'generated', subpath: 'icons/generated/Spreadsheet.png', reason: 'Costing bibles, margin calculations, and spreadsheet models' },
  BUILDING: { name: 'Building.png', type: 'generated', subpath: 'icons/generated/Building.png', reason: 'Factory layout, plant infrastructure, and commercial property setup' },
  COINS: { name: 'Coins.png', type: 'generated', subpath: 'icons/generated/Coins.png', reason: 'Revenue multiplication, income generation, and wealth scaling' },
  SPARKLES: { name: 'Sparkles.png', type: 'generated', subpath: 'icons/generated/Sparkles.png', reason: 'AI prompts, viral magic enhancements, and smart algorithms' },
  BADGE_CHECK: { name: 'BadgeCheck.png', type: 'generated', subpath: 'icons/generated/BadgeCheck.png', reason: 'Quality control protocols, inspection checklists, and verified standards' },
  MICROPHONE: { name: 'Microphone.png', type: 'generated', subpath: 'icons/generated/Microphone.png', reason: 'Podcast content studios, audio broadcasting, and voice interviews' },
  CLIPBOARD_CHECK: { name: 'ClipboardCheck.png', type: 'generated', subpath: 'icons/generated/ClipboardCheck.png', reason: 'Hygiene checks, audit routines, and testing signoffs' },
  COFFEE: { name: 'Coffee.png', type: 'generated', subpath: 'icons/generated/Coffee.png', reason: 'Specialty cafe aesthetics, beverage formulation, and culinary recipes' },
  SHIRT: { name: 'Shirt.png', type: 'generated', subpath: 'icons/generated/Shirt.png', reason: 'Apparel merchandising, t-shirt startup, and fashion manufacturing' },
  MAP: { name: 'Map.png', type: 'generated', subpath: 'icons/generated/Map.png', reason: 'Google Maps lead generation, local domination, and regional territory mapping' },
  USERS: { name: 'Users.png', type: 'generated', subpath: 'icons/generated/Users.png', reason: 'Dealership networks, distribution channels, and sales partnerships' },
  GIFT: { name: 'Gift.png', type: 'generated', subpath: 'icons/generated/Gift.png', reason: 'Bonus toolkits, value-add perks, and bundled extras' },
} as const;

export const ALL_ICONS_LIST: IconMeta[] = Object.values(KIT_ICONS);

export interface ResolvedKitItem {
  title: string;
  iconName: string;
  iconUrl: string;
  type: 'existing' | 'generated';
  reason: string;
  candidates: string[];
}

/**
 * Returns prioritized candidate icons for a given resource title based on semantic meaning.
 * Strictly adheres to: 1st preference existing, 2nd preference existing alternative, 3rd preference generated.
 */
export function getCandidateIcons(title: string): IconMeta[] {
  const t = (title || '').toLowerCase().trim();
  const match = (pattern: RegExp) => pattern.test(t);
  const res: IconMeta[] = [];

  // 1. Launch, Rocket, Takeoff, Start
  if (match(/\b(launch|takeoff|startup|kickoff|start\w*)\b/)) {
    res.push(KIT_ICONS.ROCKET, KIT_ICONS.FLAG, KIT_ICONS.CALENDAR, KIT_ICONS.BOOK);
  }

  // 2. Market Research, Finding, Scouting, Discovery, Validation
  if (match(/\b(market research|validation|finding|finder|scouting|discovery|audit)\b/)) {
    res.push(KIT_ICONS.SEARCH, KIT_ICONS.TARGET, KIT_ICONS.CHECKLIST);
  }

  // 3. Instagram, Viral, Social, Influencer, Ads, Promotion, Marketing
  if (match(/\b(instagram|viral|influencer|ad\b|ads\b|promot\w*|campaign\w*)\b/)) {
    res.push(KIT_ICONS.NOTIFICATION, KIT_ICONS.PEOPLE, KIT_ICONS.MEGAPHONE, KIT_ICONS.SPARKLES);
  }
  if (match(/\bmarketing\b/)) {
    res.push(KIT_ICONS.PEOPLE, KIT_ICONS.GLOBE, KIT_ICONS.MEGAPHONE);
  }

  // 4. Content ideas, Creative, Innovation
  if (match(/\b(content ideas?|creative|innovat\w*|ideation)\b/)) {
    res.push(KIT_ICONS.DOCUMENT, KIT_ICONS.LIGHTBULB, KIT_ICONS.SPARKLES);
  }

  // 5. Photography, Camera, Styling, Visuals, Images
  if (match(/\b(photograph\w*|camera|styling|visuals?|images?|photos?)\b/)) {
    res.push(KIT_ICONS.STAR, KIT_ICONS.DOCUMENT, KIT_ICONS.CAMERA);
  }

  // 6. Video, YouTube, Shorts, Reels, Podcast, Audio, Microphone, Studio
  if (match(/\b(podcast|audio|microphone|sound|voice)\b/)) {
    res.push(KIT_ICONS.CUSTOMER_SERVICE, KIT_ICONS.MICROPHONE, KIT_ICONS.VIDEO);
  }
  if (match(/\b(video|youtube|shorts|reels?|filming|broadcast\w*)\b/)) {
    res.push(KIT_ICONS.NOTIFICATION, KIT_ICONS.VIDEO, KIT_ICONS.CAMERA);
  }

  // 7. Pricing, Price, Costing, Margin, Discount, Tag
  if (match(/\b(pricing|price|costing|margins?|discounts?|tags?)\b/)) {
    res.push(KIT_ICONS.PERCENTAGE, KIT_ICONS.CHART, KIT_ICONS.TAG, KIT_ICONS.SPREADSHEET);
  }

  // 8. Invoices, Billing, Tax, GST, FIRC, Advance-tax
  if (match(/\b(invoice\w*|billing|taxes?|taxation|gst\b|firc|advance-tax)\b/)) {
    res.push(KIT_ICONS.DOCUMENT, KIT_ICONS.BANK, KIT_ICONS.INVOICE);
  }

  // 9. Payment, Payments, Wire, Wise, Paypal, Stripe, Payoneer, Wallet, Payouts, FEMA
  if (match(/\b(payments?|wire|wise|paypal|stripe|payoneer|wallet|payouts?|fema|transfer)\b/)) {
    res.push(KIT_ICONS.BANK, KIT_ICONS.WALLET, KIT_ICONS.COINS);
  }

  // 10. Revenue, Money, Wealth, Income, Multiplication, Coins
  if (match(/\b(revenue|multiplication|wealth|income|cash\b|coins?)\b/)) {
    res.push(KIT_ICONS.GROWTH, KIT_ICONS.CHART, KIT_ICONS.BANK, KIT_ICONS.COINS);
  }

  // 11. B2B, Corporate, Deals, Dealership, Enterprise, Contracts
  if (match(/\b(b2b|corporate|dealerships?|dealers?|enterprise|contracts?|agreements?)\b/)) {
    res.push(KIT_ICONS.DOCUMENT, KIT_ICONS.PEOPLE, KIT_ICONS.BRIEFCASE, KIT_ICONS.USERS);
  }

  // 12. Sourcing, Inventory, Supply, Packaging, Box, Unboxing, Raw materials
  if (match(/\b(packaging|unboxing|raw material\w*|inventory|sourcing|suppl\w*)\b/)) {
    res.push(KIT_ICONS.CUBE, KIT_ICONS.BOX_OPEN, KIT_ICONS.TRUCK);
  }

  // 13. Logistics, Delivery, Shipping, Freight, Transportation
  if (match(/\b(logistics|delivery|shipping|freight|transport\w*|courier)\b/)) {
    res.push(KIT_ICONS.LOCATION, KIT_ICONS.TRUCK, KIT_ICONS.BOX_OPEN);
  }

  // 14. Customer Retention, Loyalty, Repeat, Relationship, Trust cycle, Heart
  if (match(/\b(retention|loyalty|repeat|trust cycle|relationship|care|heart)\b/)) {
    res.push(KIT_ICONS.CUSTOMER_SERVICE, KIT_ICONS.PEOPLE, KIT_ICONS.HEART);
  }

  // 15. Customer Service, Support, Queries, Feedback
  if (match(/\b(customer service|support|queries|helpdesk|feedback|hotline)\b/)) {
    res.push(KIT_ICONS.CUSTOMER_SERVICE, KIT_ICONS.PHONE, KIT_ICONS.STAR);
  }

  // 16. Hiring, Team, Staff, HR, Recruitment, Employees, Training
  if (match(/\b(hiring|recruitment|staff\w*|teams?|employees?|manpower|training)\b/)) {
    res.push(KIT_ICONS.PEOPLE, KIT_ICONS.USER_PLUS, KIT_ICONS.USERS);
  }

  // 17. Labour laws, Statutory, Legal, Legal structure, Compliance, Balance
  if (match(/\b(labour laws?|statutory|legal|compliance|regulatory|laws?)\b/)) {
    res.push(KIT_ICONS.LOCK, KIT_ICONS.DOCUMENT, KIT_ICONS.BALANCE);
  }

  // 18. Licenses, FSSAI, Certification, Accreditations, Approvals, Registration, Award
  if (match(/\b(licens\w*|fssai|certificat\w*|accredit\w*|approvals?|registration)\b/)) {
    res.push(KIT_ICONS.DOCUMENT, KIT_ICONS.AWARD, KIT_ICONS.BADGE_CHECK);
  }

  // 19. Quality standards, Testing, Protocols, QC, Hygiene, Inspection
  if (match(/\b(quality|testing|protocols?|standards?|hygiene|inspection|qc\b)\b/)) {
    res.push(KIT_ICONS.STAR, KIT_ICONS.BADGE_CHECK, KIT_ICONS.CLIPBOARD_CHECK);
  }

  // 20. Mistakes to avoid, Warnings, Risk, Failure, Recall, Pitfalls, Alert
  if (match(/\b(mistakes?|avoid\w*|fatal|failures?|recalls?|pitfalls?|warnings?)\b/)) {
    res.push(KIT_ICONS.CHECKLIST, KIT_ICONS.ALERT, KIT_ICONS.SHIELD);
  }
  if (match(/\brisk\w*\b/)) {
    res.push(KIT_ICONS.LOCK, KIT_ICONS.SHIELD, KIT_ICONS.ALERT);
  }

  // 21. Success stories, Case studies, Awards, Achievements, Trophy
  if (match(/\b(success stories?|case stud\w*|awards?|achieve\w*|troph\w*)\b/)) {
    res.push(KIT_ICONS.STAR, KIT_ICONS.BOOK, KIT_ICONS.TROPHY);
  }

  // 22. Roadmap, Expansion, Scale, Milestone, Compass, Progression
  if (match(/\b(expansion|roadmap|compass|direction|future)\b/)) {
    res.push(KIT_ICONS.GROWTH, KIT_ICONS.STAIRS, KIT_ICONS.COMPASS);
  }
  if (match(/\b(scaling|scale|growth)\b/)) {
    res.push(KIT_ICONS.GROWTH, KIT_ICONS.STAIRS, KIT_ICONS.CHART);
  }
  if (match(/\b(milestones?|stages?|phase\w*)\b/)) {
    res.push(KIT_ICONS.STAIRS, KIT_ICONS.CALENDAR, KIT_ICONS.FLAG);
  }

  // 23. Franchise, Store, Shop, Outlet, Retail, Showroom
  if (match(/\b(franchise|store\w*|shops?|outlets?|retail|showroom)\b/)) {
    res.push(KIT_ICONS.LOCATION, KIT_ICONS.STORE, KIT_ICONS.BUILDING);
  }

  // 24. Factory, Plant, Machinery, Equipment, Layout, Building, Wrench
  if (match(/\b(machinery|equipment|tools? guide|tools? kit|hardware setup)\b/)) {
    res.push(KIT_ICONS.SETTINGS, KIT_ICONS.CHIP, KIT_ICONS.WRENCH);
  }
  if (match(/\b(factory|plant|layout|facility|facilities|warehouse|infrastructure|manufacturing unit)\b/)) {
    res.push(KIT_ICONS.SETTINGS, KIT_ICONS.BUILDING, KIT_ICONS.STORE);
  }

  // 25. Food, Beverage, Coffee, Snacks, Drinks, Menu, Kitchen, Culinary
  if (match(/\b(coffee|cafe|drinks?|beverage\w*|food|snacks?|menu|recipes?|kitchen|culinary)\b/)) {
    res.push(KIT_ICONS.CUBE, KIT_ICONS.COFFEE, KIT_ICONS.STORE);
  }

  // 26. Apparel, Fashion, Shirt, T-Shirt, Merch, Garments, Thrift
  if (match(/\b(tshirt|shirt|apparel|fashion|merch\w*|garments?|clothing|thrift)\b/)) {
    res.push(KIT_ICONS.CUBE, KIT_ICONS.SHIRT, KIT_ICONS.BOX_OPEN);
  }

  // 27. Local, Maps, Google Maps, Territory, Regional
  if (match(/\b(google maps?|local domination|territor\w*|regional)\b/)) {
    res.push(KIT_ICONS.LOCATION, KIT_ICONS.GLOBE, KIT_ICONS.MAP);
  }
  if (match(/\b(location|site selection|geograph\w*)\b/)) {
    res.push(KIT_ICONS.LOCATION, KIT_ICONS.GLOBE, KIT_ICONS.MAP);
  }

  // 28. AI, Automation, Code, Software, Tech stack, Digital tools
  if (match(/\b(ai\b|automation|algorithms?|code\b|scripts?|software stack|tech stack|digital tools)\b/)) {
    res.push(KIT_ICONS.CHIP, KIT_ICONS.CLOUD, KIT_ICONS.CODE, KIT_ICONS.SPARKLES);
  }

  // 29. Email, Newsletter, Cold email, Correspondence
  if (match(/\b(email\w*|newsletters?|mail\b|inbox)\b/)) {
    res.push(KIT_ICONS.NOTIFICATION, KIT_ICONS.PHONE, KIT_ICONS.MAIL);
  }

  // 30. WhatsApp, Phone, Calling, DM, Messages
  if (match(/\b(whatsapp|phone|calling|scripts?|messages?|chat)\b/)) {
    res.push(KIT_ICONS.PHONE, KIT_ICONS.CUSTOMER_SERVICE, KIT_ICONS.NOTIFICATION);
  }

  // 31. Banking, Loans, Subsidies, Funding, PMKSY, Mudra, Capital
  if (match(/\b(banks?|loans?|subsid\w*|mudra|pmksy|funding|capital|grants?|schemes?)\b/)) {
    res.push(KIT_ICONS.BANK, KIT_ICONS.CHART, KIT_ICONS.COINS, KIT_ICONS.INVOICE);
  }

  // 32. Financial models, Spreadsheet, Matrix, Unit economics, Calculations
  if (match(/\b(spreadsheet|models?|matrix|calculations?|economics|unit economics|breakdown|projections?)\b/)) {
    res.push(KIT_ICONS.CHART, KIT_ICONS.PIE, KIT_ICONS.SPREADSHEET);
  }

  // 33. Checklist, SOP, Daily rhythm, Routine, Steps, Action plan
  if (match(/\b(checklists?|sops?|standard operating procedure|daily|weekly|monthly rhythm|routines?|tasks?)\b/)) {
    res.push(KIT_ICONS.CHECKLIST, KIT_ICONS.SETTINGS, KIT_ICONS.CLIPBOARD_CHECK);
  }

  // 34. Calendar, 30-Day, 90-Day, Countdown, Timeline, Schedule
  if (match(/\b(calendar|schedules?|timelines?|countdowns?|30-day|90-day|annual)\b/)) {
    res.push(KIT_ICONS.CALENDAR, KIT_ICONS.CLOCK, KIT_ICONS.FLAG);
  }

  // 35. Time, Speed, Fast, Clock, Hours
  if (match(/\b(clock|hours?|speed|fast|quick|timing|time)\b/)) {
    res.push(KIT_ICONS.CLOCK, KIT_ICONS.CALENDAR, KIT_ICONS.CHECKLIST);
  }

  // 36. Recycling, Sustainability, Eco, Green, Organic, Waste
  if (match(/\b(sustainab\w*|recycl\w*|eco\b|green|organic|waste|circular)\b/)) {
    res.push(KIT_ICONS.RECYCLE, KIT_ICONS.GLOBE, KIT_ICONS.SETTINGS);
  }

  // 37. Downloads, Free toolkit, Bonus, Perks, Gift
  if (match(/\b(free|bonus\w*|perks?|gifts?|extras?)\b/)) {
    res.push(KIT_ICONS.DOWNLOAD, KIT_ICONS.CUBE, KIT_ICONS.GIFT);
  }
  if (match(/\b(downloads?|pdfs?|files?|deliverables?|materials?)\b/)) {
    res.push(KIT_ICONS.DOWNLOAD, KIT_ICONS.DOCUMENT, KIT_ICONS.BOOK);
  }

  // 38. Blueprint, Guide, Playbook, Handbook, Overview, Framework
  if (match(/\b(blueprints?|guides?|handbooks?|playbooks?|frameworks?|overview|principles)\b/)) {
    res.push(KIT_ICONS.BOOK, KIT_ICONS.DOCUMENT, KIT_ICONS.CUBE);
  }

  // 39. Global / Export
  if (match(/\b(export|import|global|international|cross-border)\b/)) {
    res.push(KIT_ICONS.GLOBE, KIT_ICONS.LOCATION, KIT_ICONS.MAP, KIT_ICONS.TRUCK);
  }

  // Universal fallbacks in preference order: existing first, then others
  res.push(
    KIT_ICONS.DOCUMENT,
    KIT_ICONS.BOOK,
    KIT_ICONS.CHECKLIST,
    KIT_ICONS.SETTINGS,
    KIT_ICONS.CUBE,
    KIT_ICONS.LAYERS,
    KIT_ICONS.STAR,
    KIT_ICONS.PEOPLE
  );

  return res;
}

/**
 * Resolves an entire kit includes list with guaranteed 100% uniqueness per kit.
 * No resource icon will be repeated within an individual product's includes list.
 *
 * @param includes Array of raw or cleaned resource title strings
 * @param basePath Base public path (e.g. import.meta.env.BASE_URL)
 */
export function resolveKitIncludes(
  includes: (string | any)[] = [],
  basePath: string = ''
): ResolvedKitItem[] {
  const cleanBase = basePath.replace(/\/$/, '');
  const result: ResolvedKitItem[] = [];
  const usedInKit = new Set<string>();

  includes.forEach((item) => {
    const raw = typeof item === 'string' ? item : (item ? String(item) : '');
    const cleanTitle = raw.replace(/\s*\[cite:[^\]]+\]/g, '').trim();
    if (!cleanTitle) return;

    const candidates = getCandidateIcons(cleanTitle);

    // 1st / 2nd / 3rd preference: First matching candidate not yet used in this kit
    let chosen: IconMeta | undefined = candidates.find((c) => !usedInKit.has(c.name));

    // Fallback: If all specific candidates were used earlier in this kit, pick any unused icon from pool
    if (!chosen) {
      chosen = ALL_ICONS_LIST.find((c) => !usedInKit.has(c.name));
    }

    // Safety fallback (if kit length exceeds pool size, which it won't as pool is 66)
    if (!chosen) {
      chosen = candidates[0] || KIT_ICONS.DOCUMENT;
    }

    usedInKit.add(chosen.name);

    result.push({
      title: cleanTitle,
      iconName: chosen.name,
      iconUrl: `${cleanBase}/${chosen.subpath}`,
      type: chosen.type,
      reason: chosen.reason,
      candidates: candidates.map((c) => c.name),
    });
  });

  return result;
}
