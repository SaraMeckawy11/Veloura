export const DEFAULT_PRICING_TIER = 'signature';

export const PRICING_TIERS = [
  {
    id: 'essential',
    name: 'Essential',
    badge: 'Simple & elegant',
    price: '$59',
    oldPrice: '$79',
    amount: '59.00',
    description: 'A polished invitation with the core details your guests need.',
    features: [
      'Any launch invitation design',
      'Cinematic splash screen reveal',
      'Couple names, date, time & venue',
      'Google Maps location link',
      'Custom invitation font',
      'Private owner dashboard',
    ],
    sections: {
      rsvp: false,
      story: false,
      gallery: false,
    },
  },
  {
    id: 'signature',
    name: 'Signature',
    badge: 'Most popular',
    price: '$99',
    oldPrice: '$119',
    amount: '99.00',
    description: 'The complete guest-ready invitation with every interactive section.',
    featured: true,
    features: [
      'Everything in Essential',
      'RSVP section with guest tracking',
      'Our Story timeline',
      'Photo gallery',
      'All interactive sections',
    ],
    sections: {
      rsvp: true,
      story: true,
      gallery: true,
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
