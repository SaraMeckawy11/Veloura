export const DEFAULT_PRICING_TIER = 'signature';

export const PRICING_TIERS = [
  {
    id: 'essential',
    name: 'Essential',
    badge: 'Simple & elegant',
    tagline: 'One-time payment. No monthly fees.',
    price: '$39',
    oldPrice: '$59',
    amount: '39.00',
    oldAmount: '59.00',
    description: 'Core details, beautifully presented.',
    features: [
      'Choose any Veloura invitation design',
      'Cinematic splash screen reveal',
      'Couple names, date, time & venue',
      'Personal envelope message',
      'Live countdown to your wedding day',
      'Google Maps location link',
      'Matching invitation font',
      'Private editing dashboard',
    ],
    demoCards: [
      { invitation: 'Garden Pavilion', fields: ['Core details', 'Countdown', 'Map'] },
      { invitation: 'Boarding Pass', fields: ['Core details', 'Countdown', 'Map'] },
      { invitation: 'Coastal Breeze', fields: ['Core details', 'Countdown', 'Map'] },
      { invitation: 'Fountain Reverie I', fields: ['Core details', 'Countdown', 'Map'] },
      { invitation: 'Fountain Reverie II', fields: ['Core details', 'Countdown', 'Map'] },
      { invitation: 'Theater', fields: ['Core details', 'Countdown', 'Map'] },
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
    badge: 'Most Popular',
    tagline: 'One-time payment. Includes RSVP & guest tracking.',
    price: '$69',
    oldPrice: '$89',
    amount: '69.00',
    oldAmount: '89.00',
    description: 'RSVP, story & gallery included.',
    featured: true,
    features: [
      'Everything in Essential',
      'RSVP form for guest replies',
      'RSVP dashboard with live guest tracking',
      'Our Story timeline',
      'Photo gallery section',
      'Schedule / wedding day details section',
      'Dress code section',
      'All premium invitation sections',
    ],
    demoCards: [
      { invitation: 'Garden Pavilion', fields: ['Story', 'Guest policy', 'RSVP'] },
      { invitation: 'Boarding Pass', fields: ['Story route', 'Gallery', 'RSVP'] },
      { invitation: 'Coastal Breeze', fields: ['Envelope note', 'Story', 'RSVP'] },
      { invitation: 'Fountain Reverie I', fields: ['Envelope note', 'Gallery', 'RSVP'] },
      { invitation: 'Fountain Reverie II', fields: ['Story', 'Gallery', 'RSVP'] },
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
