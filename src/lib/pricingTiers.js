export const DEFAULT_PRICING_TIER = 'signature';

export const PRICING_TIERS = [
  {
    id: 'essential',
    name: 'Essential',
    badge: 'Simple & elegant',
    price: 'EGP 2,070',
    oldPrice: 'EGP 3,130',
    amount: '39.00',
    oldAmount: '59.00',
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
    demoCards: [
      { invitation: 'Garden Pavilion', fields: ['Splash', 'Names', 'Date'] },
      { invitation: 'Boarding Pass', fields: ['Venue', 'Map', 'Countdown'] },
    ],
    sections: {
      countdown: true,
      coupleMessage: false,
      story: false,
      gallery: false,
      rsvp: false,
      music: false,
    },
  },
  {
    id: 'signature',
    name: 'Signature',
    badge: 'Most popular',
    price: 'EGP 3,660',
    oldPrice: 'EGP 5,250',
    amount: '69.00',
    oldAmount: '99.00',
    description: 'The best-value guest-ready invitation with the sections couples ask for most.',
    featured: true,
    features: [
      'Everything in Essential',
      'Personal envelope "A Note" message',
      'Our Story timeline',
      'Photo gallery',
      'RSVP section with guest tracking',
      'All interactive sections',
    ],
    demoCards: [
      { invitation: 'Fountain Reverie', fields: ['Story', 'Gallery', 'RSVP'] },
      { invitation: 'Coastal Breeze', fields: ['Envelope note', 'Guest policy', 'Map'] },
      { invitation: 'Theater', fields: ['Memories', 'Details', 'RSVP'] },
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
  if (value === 'luxe') return 'signature';
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
