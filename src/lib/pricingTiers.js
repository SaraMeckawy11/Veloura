export const DEFAULT_PRICING_TIER = 'signature';

export const PRICING_TIERS = [
  {
    id: 'essential',
    name: 'Essential',
    badge: 'Simple ceremony',
    price: '$59',
    oldPrice: '$79',
    amount: '59.00',
    description: 'A polished invitation with the core details guests need.',
    features: [
      'Any launch invitation design',
      'Cinematic splash screen',
      'Couple names, date, time and venue',
      'Google Maps link',
      'Private owner dashboard',
    ],
    sections: {
      rsvp: false,
      story: false,
      gallery: false,
      music: false,
    },
  },
  {
    id: 'signature',
    name: 'Signature',
    badge: 'Most popular',
    price: '$99',
    oldPrice: '$119',
    amount: '99.00',
    description: 'The complete guest-ready invitation for most weddings.',
    featured: true,
    features: [
      'Everything in Essential',
      'RSVP section with guest tracking',
      'Our Story timeline',
      'Photo gallery',
      'Custom invitation font',
    ],
    sections: {
      rsvp: true,
      story: true,
      gallery: true,
      music: false,
    },
  },
  {
    id: 'luxe',
    name: 'Luxe',
    badge: 'Full experience',
    price: '$149',
    oldPrice: '$179',
    amount: '149.00',
    description: 'A richer invitation experience with every hosted section.',
    features: [
      'Everything in Signature',
      'Background music support',
      'Expanded gallery experience',
      'All interactive sections',
      'Priority design polish',
    ],
    sections: {
      rsvp: true,
      story: true,
      gallery: true,
      music: true,
    },
  },
];

export function normalizePricingTier(value) {
  return PRICING_TIERS.some(tier => tier.id === value) ? value : DEFAULT_PRICING_TIER;
}

export function getPricingTier(value) {
  const normalized = normalizePricingTier(value);
  return PRICING_TIERS.find(tier => tier.id === normalized) || PRICING_TIERS[1];
}

export function tierAllows(value, section) {
  return Boolean(getPricingTier(value).sections?.[section]);
}

export function getTierDisabledFields(value) {
  const tier = getPricingTier(value);
  return tier.sections.rsvp ? [] : ['rsvp'];
}
