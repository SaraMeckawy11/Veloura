export const DEFAULT_PRICING_TIER = 'signature';

export const PRICING_TIERS = [
  {
    id: 'signature',
    name: 'Premium',
    badge: 'Complete Experience',
    tagline: 'One-time payment. No monthly fees.',
    price: '$79',
    oldPrice: '$99',
    amount: '79.00',
    oldAmount: '99.00',
    description: 'Every Veloura feature in one complete invitation.',
    featured: true,
    features: [
      'Choose any Veloura invitation design',
      'Cinematic splash screen reveal',
      'Couple names, date, time & venue',
      'Personal envelope message',
      'Live countdown to your celebration',
      'Google Maps location link',
      'Our Story timeline',
      'Photo gallery section',
      'RSVP form with live guest tracking',
      'Matching invitation font',
      'Private editing dashboard',
    ],
    demoCards: [
      { invitation: 'Boarding Pass', fields: ['Story route', 'Gallery', 'RSVP'] },
      { invitation: 'Garden Pavilion', fields: ['Story', 'Guest policy', 'RSVP'] },
      { invitation: 'Coastal Breeze', fields: ['Envelope note', 'Story', 'RSVP'] },
      // Temporarily hidden designs:
      // { invitation: 'Fountain Reverie I', fields: ['Envelope note', 'Gallery', 'RSVP'] },
      // { invitation: 'Fountain Reverie II', fields: ['Story', 'Gallery', 'RSVP'] },
      // { invitation: 'Theater', fields: ['Memories', 'Details', 'RSVP'] },
    ],
    sections: {
      countdown: true,
      coupleMessage: true,
      story: true,
      gallery: true,
      rsvp: true,
      music: false,
    },
  },
];

export function normalizePricingTier(value) {
  if (value === 'luxe' || value === 'essential') return 'signature';
  return PRICING_TIERS.some(tier => tier.id === value) ? value : DEFAULT_PRICING_TIER;
}

export function getPricingTier(value) {
  const normalized = normalizePricingTier(value);
  return PRICING_TIERS.find(tier => tier.id === normalized) || PRICING_TIERS[0];
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
