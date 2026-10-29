/**
 * Utility to semantically map resource titles to icon assets in `/icons/processed/`
 * and enforce the strict rule: No consecutive resource icon repetition within each kit.
 */

export const KIT_ICONS = {
  BANK: 'Bank.png',
  BOOK: 'Book.png',
  CALENDAR: 'Calender.png',
  CHART: 'Chart.png',
  CHECKLIST: 'checklist.png',
  CHIP: 'Chip.png',
  CLOCK: 'Clock.png',
  CLOUD: 'Cloud.png',
  CUBE: 'Cube.png',
  CUSTOMER_SERVICE: 'Customer service.png',
  DOCUMENT: 'Document.png',
  DOWNLOAD: 'Download.png',
  GLOBE: 'Globe.png',
  GROWTH: 'Growth.png',
  GROWTH_COPY: 'Growth copy.png',
  LAYERS: 'Layers.png',
  LINK: 'link.png',
  LOCATION: 'Location.png',
  LOCK: 'Lock.png',
  NOTIFICATION: 'Notification.png',
  PEOPLE: 'people.png',
  PERCENTAGE: 'Percentage.png',
  PHONE: 'Phone.png',
  PIE: 'Pie.png',
  RECYCLE: 'Recycle.png',
  SETTINGS: 'Settings.png',
  STAIRS: 'Stairs.png',
  STAR: 'Star.png',
  TICK: 'Tick.png',
} as const;

export interface ResolvedKitItem {
  title: string;
  iconName: string;
  iconUrl: string;
  candidates: string[];
}

/**
 * Returns prioritized candidate icons for a given resource title based on semantic meaning.
 */
export function getCandidateIcons(title: string): string[] {
  const t = (title || '').toLowerCase().trim();
  const match = (pattern: RegExp) => pattern.test(t);

  // 1. Sustainability / recycling / waste / eco-friendly / green
  if (match(/\b(sustainab\w*|recycl\w*|waste|eco-friendly|green|circular|organic farming)\b/)) {
    return [KIT_ICONS.RECYCLE, KIT_ICONS.GLOBE, KIT_ICONS.SETTINGS];
  }

  // 2. Security / privacy / protection / confidential / lock
  if (match(/\b(security|privacy|confidential|protection|lock)\b/)) {
    return [KIT_ICONS.LOCK, KIT_ICONS.DOCUMENT];
  }

  // 3. Bank, Loans, Subsidies, Government schemes, Funding, Investor, Pitch deck, Grants, Capital, Finance
  if (match(/\b(banks?|loans?|subsid\w*|government|pmksy|grants?|funding|capital|investors?|pitch deck|finance|financial)\b/)) {
    return [KIT_ICONS.BANK, KIT_ICONS.CHART, KIT_ICONS.PERCENTAGE];
  }

  // 4. Location / geography / site / area / regional / local
  if (match(/\b(location|site|geography|regional|local|area|geograph\w*)\b/)) {
    return [KIT_ICONS.LOCATION, KIT_ICONS.GLOBE];
  }

  // 5. Communication / Phone / WhatsApp / DM / Scripts / Message templates / Outreach / Calling / Contact / Inquiries
  if (match(/\b(whatsapp|scripts?|messages?|dm\b|calling|phone|outreach|communication|contact|inquir\w*)\b/)) {
    return [KIT_ICONS.PHONE, KIT_ICONS.NOTIFICATION, KIT_ICONS.CUSTOMER_SERVICE];
  }

  // 6. Social Media / Viral Content / Instagram / Notification / Content ideas / Influencer / Ads
  if (match(/\b(viral|instagram|notification|influencer|ad copy|ads\b|content ideas?|social media)\b/)) {
    if (match(/\b(calendar|schedule)\b/)) {
      return [KIT_ICONS.CALENDAR, KIT_ICONS.CLOCK, KIT_ICONS.NOTIFICATION];
    }
    return [KIT_ICONS.NOTIFICATION, KIT_ICONS.GLOBE, KIT_ICONS.PEOPLE];
  }

  // 7. AI, Technology stack, Hardware, Chips, Tools, Apps, Software, Smart farming
  if (match(/\b(ai\b|tech\b|technology|chip|hardware|apps\b|software|smart farming)\b/)) {
    return [KIT_ICONS.CHIP, KIT_ICONS.CLOUD, KIT_ICONS.LINK, KIT_ICONS.SETTINGS];
  }

  // 8. Cloud / Integration / Links / Connectivity / API
  if (match(/\b(cloud|integration|links?|api\b|connectivity)\b/)) {
    return [KIT_ICONS.CLOUD, KIT_ICONS.LINK, KIT_ICONS.CHIP];
  }

  // 9. Legal, Licensing, Compliance, Agreement, Contract, FSSAI, Registration, Terms, NDA
  if (match(/\b(legal|licens\w*|complian\w*|agreements?|contracts?|regulatory|fssai|registration|statutory|\bnda\b)\b/)) {
    return [KIT_ICONS.LOCK, KIT_ICONS.DOCUMENT, KIT_ICONS.GLOBE];
  }

  // 10. Customer experience, Quality, Testing, Standards, Reviews, Success stories, Awards, Protocols
  if (match(/\b(quality|customer experience|testing|standards?|reviews?|success|stories|story|case stud\w*|awards?|ratings?|protocols?)\b/)) {
    return [KIT_ICONS.STAR, KIT_ICONS.CUSTOMER_SERVICE, KIT_ICONS.CHECKLIST];
  }

  // 11. Customer service, Support, Retention, Loyalty, Repeat customer, Referral, Trust cycle
  if (match(/\b(customer service|support|retention|repeat customer|loyalty|referrals?|trust cycle)\b/)) {
    return [KIT_ICONS.CUSTOMER_SERVICE, KIT_ICONS.PEOPLE, KIT_ICONS.STAR];
  }

  // 12. Marketing, Client acquisition, Audience, Leads, Traffic, Conversion, B2B sales
  if (match(/\b(marketing|acquisition|audiences?|client acquisition|leads?|traffic|conversion|buyer journey|b2b)\b/)) {
    return [KIT_ICONS.PEOPLE, KIT_ICONS.GLOBE, KIT_ICONS.CUSTOMER_SERVICE];
  }

  // 13. Global, Export, Import, International, D2C, Direct-to-Consumer, Website, Ecommerce
  if (match(/\b(export|import|global|international|websites?|ecommerce|e-commerce|d2c|direct-to-consumer)\b/)) {
    return [KIT_ICONS.GLOBE, KIT_ICONS.PEOPLE, KIT_ICONS.LOCATION];
  }

  // 14. Matrix, Calculations, Economics, Costing, Budget, CAC, LTV, Margin, Analytics, Breakdown, Unit Economics
  if (match(/\b(matrix|calculations?|economics|costing|budgets?|cac|ltv|margins?|percentages?|analytics|analysis|pie|breakdown|metrics?|unit economic\w*)\b/)) {
    return [KIT_ICONS.CHART, KIT_ICONS.PIE, KIT_ICONS.PERCENTAGE, KIT_ICONS.SETTINGS];
  }

  // 15. Revenue, Money-making, Offers, Products & Services, Pricing, Catalog, Menu, Revenue streams
  if (match(/\b(revenue|money-making|offers?|products? & services?|product lines?|product categories|product portfolio|catalog|menu|pricing|best sellers?|income)\b/)) {
    return [KIT_ICONS.CHART, KIT_ICONS.BANK, KIT_ICONS.PERCENTAGE, KIT_ICONS.CUBE];
  }

  // 16. Profit, Profitability, Growth, Roadmap, Expansion, Scale, Milestone, Stairs, Franchise
  if (match(/\b(profit|profitability|growth|roadmaps?|expansion|scale|scaling|progression|milestones?|stairs?|franchise)\b/)) {
    return [KIT_ICONS.GROWTH, KIT_ICONS.STAIRS, KIT_ICONS.GROWTH_COPY, KIT_ICONS.CHART];
  }

  // 17. Packages, Tiers, Bundle, Box, Structure, Layers
  if (match(/\b(packages?|tiers?|bundles?|box|layers?|structure|levels?)\b/)) {
    return [KIT_ICONS.LAYERS, KIT_ICONS.CUBE, KIT_ICONS.STAIRS];
  }

  // 18. Operations, Routine, SOP, Housekeeping, Daily rhythm, Workflow, Process, Management, Tasks
  if (match(/\b(operations?|routine|sops?|standard operating procedure|housekeeping|workflow|process|management|setup|fulfillment|tasks?)\b/)) {
    return [KIT_ICONS.SETTINGS, KIT_ICONS.CHECKLIST, KIT_ICONS.CLOCK];
  }

  // 19. Calendar, Schedule, Weekly, Monthly, 30-Day, 90-Day, Countdown, Timeline
  if (match(/\b(calendar|calender|schedules?|timelines?|countdowns?|30-day|90-day|weekly|monthly)\b/)) {
    return [KIT_ICONS.CALENDAR, KIT_ICONS.CLOCK, KIT_ICONS.CHECKLIST];
  }

  // 20. Checklist, Steps, 10-step, Launch plan, Action plan, Avoidance, Mistakes guide
  if (match(/\b(checklists?|10-step|steps?|launch plan|action plan|mistakes?|avoidance|prevention|fatal)\b/)) {
    return [KIT_ICONS.CHECKLIST, KIT_ICONS.CALENDAR, KIT_ICONS.CLOCK, KIT_ICONS.BOOK];
  }

  // 21. Clock, Hours, Fast, Time, Instant, Duration, 5-minute
  if (match(/\b(clock|hours?|fast|speed|time|duration|5-minute|instant)\b/)) {
    return [KIT_ICONS.CLOCK, KIT_ICONS.CALENDAR, KIT_ICONS.CHECKLIST];
  }

  // 22. Download, PDF, Files, Deliverables, Assets, Material, Tool Kit
  if (match(/\b(downloads?|pdfs?|files?|deliverables?|materials?|assets?|tool kit|resources?)\b/)) {
    return [KIT_ICONS.DOWNLOAD, KIT_ICONS.DOCUMENT, KIT_ICONS.BOOK];
  }

  // 23. Blueprint, Guide, Handbook, Playbook, Framework, Strategy, Model, Overview, Principles
  if (match(/\b(blueprints?|guides?|handbooks?|playbooks?|frameworks?|strateg\w*|models?|overview|principles)\b/)) {
    return [KIT_ICONS.BOOK, KIT_ICONS.DOCUMENT, KIT_ICONS.CUBE];
  }

  // Default fallback candidates
  return [KIT_ICONS.DOCUMENT, KIT_ICONS.BOOK, KIT_ICONS.CUBE];
}

/**
 * Resolves an entire kit includes list with guaranteed anti-consecutive icon repetition.
 * Resets state per list.
 */
export function resolveKitIncludes(
  includes: (string | any)[] = [],
  basePath: string = ''
): ResolvedKitItem[] {
  const cleanBase = basePath.replace(/\/$/, '');
  const result: ResolvedKitItem[] = [];
  let prevIcon: string | null = null;

  includes.forEach((item) => {
    const raw = typeof item === 'string' ? item : (item ? String(item) : '');
    const cleanTitle = raw.replace(/\s*\[cite:[^\]]+\]/g, '').trim();
    if (!cleanTitle) return;

    const candidates = getCandidateIcons(cleanTitle);

    // Pick first candidate that doesn't repeat the previous row's icon
    let chosen = candidates[0];
    if (chosen === prevIcon) {
      chosen = candidates.find((c) => c !== prevIcon) || (chosen === KIT_ICONS.DOCUMENT ? KIT_ICONS.BOOK : KIT_ICONS.DOCUMENT);
    }

    result.push({
      title: cleanTitle,
      iconName: chosen,
      iconUrl: `${cleanBase}/icons/processed/${chosen}`,
      candidates,
    });

    prevIcon = chosen;
  });

  return result;
}
