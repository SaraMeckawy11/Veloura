export const DEFAULT_PRICING_TIER = 'signature';

export const PRICING_TIERS = [
  {
    id: 'essential',
    name: 'Essential',
    badge: 'Simple & elegant',
    price: '$29',
    oldPrice: '$59',
    amount: '29.00',
    description: 'A polished invitation with the core details your guests need.',
    features: [
      'Any launch invitation design',
      'Cinematic splash screen reveal',
      'Couple names, date, time & venue',
      'Live countdown to your day',
      'Google Maps location link',
      'Custom invitation font',
      'Private owner dashboard',
    ],
    sections: {
      countdown: true,
      coupleMessage: false,
      story: false,
      gallery: false,
      rsvp: false,
    },
  },
  {
    id: 'signature',
    name: 'Signature',
    badge: 'Most popular',
    price: '$59',
    oldPrice: '$99',
    amount: '59.00',
    description: 'The complete guest-ready invitation with every interactive section.',
    featured: true,
    features: [
      'Everything in Essential',
      'Personal envelope “A Note” message',
      'Our Story timeline',
      'Photo gallery',
      'RSVP section with guest tracking',
      'All interactive sections',
    ],
    sections: {
      countdown: true,
      coupleMessage: true,
      story: true,
      gallery: true,
      rsvp: true,
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
  const disabled = [];
  if (!tier.sections.rsvp) disabled.push('rsvp');
  if (!tier.sections.coupleMessage) disabled.push('coupleMessage');
  return disabled;
}
