export const DEFAULT_PRICING_TIER = 'signature';

export const PRICING_TIERS = [
  {
    id: 'essential',
    name: 'Essential',
    badge: 'Simple & elegant',
    price: '$49',
    oldPrice: '$69',
    amount: '49.00',
    oldAmount: '69.00',
    description: 'A polished invitation with your core details and a personal note for guests.',
    features: [
      'Any launch invitation design',
      'Cinematic splash screen reveal',
      'Couple names, date, time & venue',
      'Personal envelope "A Note" message',
      'Live countdown to your day',
      'Google Maps location link',
      'Custom invitation font',
      'Private owner dashboard',
    ],
    demoCards: [
      { invitation: 'Garden Pavilion', fields: ['Core details', 'Countdown', 'Map'] },
      { invitation: 'Coastal Breeze', fields: ['Core details', 'Countdown', 'Map'] },
      { invitation: 'Fountain Reverie I', fields: ['Core details', 'Countdown', 'Map'] },
      { invitation: 'Fountain Reverie II', fields: ['Core details', 'Countdown', 'Map'] },
      { invitation: 'Theater', fields: ['Core details', 'Countdown', 'Map'] },
      { invitation: 'Boarding Pass', fields: ['Core details', 'Countdown', 'Map'] },
    ],
    sections: {
      countdown: true,
      coupleMessage: true,
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
    price: '$74',
    oldPrice: '$99',
    amount: '74.00',
    oldAmount: '99.00',
    description: 'The best-value guest-ready invitation with the sections couples ask for most.',
    featured: true,
    features: [
      'Everything in Essential',
      'Our Story timeline',
      'Photo gallery',
      'RSVP section for guest replies',
      'Dashboard RSVP manager with live guest tracking',
      'All interactive sections',
    ],
    demoCards: [
      { invitation: 'Garden Pavilion', fields: ['Story', 'Guest policy', 'RSVP'] },
      { invitation: 'Coastal Breeze', fields: ['Envelope note', 'Story', 'RSVP'] },
      { invitation: 'Fountain Reverie I', fields: ['Envelope note', 'Gallery', 'RSVP'] },
      { invitation: 'Fountain Reverie II', fields: ['Story', 'Gallery', 'RSVP'] },
      { invitation: 'Theater', fields: ['Memories', 'Details', 'RSVP'] },
      { invitation: 'Boarding Pass', fields: ['Story route', 'Gallery', 'RSVP'] },
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
