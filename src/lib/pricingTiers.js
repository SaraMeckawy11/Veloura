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
    description: 'Core details with RSVP, beautifully presented.',
    features: [
      'Choose any Veloura invitation design',
      'Cinematic splash screen reveal',
      'Couple names, date, time & venue',
      'Personal envelope message',
      'Live countdown to your wedding day',
      'Google Maps location link',
      'RSVP form with live guest tracking',
      'Matching invitation font',
      'Private editing dashboard',
    ],
    demoCards: [
      { invitation: 'Boarding Pass', fields: ['Core details', 'Countdown', 'RSVP'] },
      { invitation: 'Garden Pavilion', fields: ['Core details', 'Countdown', 'RSVP'] },
      { invitation: 'Coastal Breeze', fields: ['Core details', 'Countdown', 'RSVP'] },
      // Temporarily hidden designs:
      // { invitation: 'Fountain Reverie I', fields: ['Core details', 'Countdown', 'RSVP'] },
      // { invitation: 'Fountain Reverie II', fields: ['Core details', 'Countdown', 'RSVP'] },
      // { invitation: 'Theater', fields: ['Core details', 'Countdown', 'RSVP'] },
    ],
    sections: {
      countdown: true,
      coupleMessage: true,
      story: false,
      gallery: false,
      rsvp: true,
      music: false,
    },
  },
  {
    id: 'signature',
    name: 'Signature',
    badge: 'Most Popular',
    tagline: 'One-time payment. Story, gallery & premium sections.',
    price: '$49',
    oldPrice: '$69',
    amount: '49.00',
    oldAmount: '69.00',
    description: 'Story, gallery & all premium sections.',
    featured: true,
    features: [
      'Everything in Essential, plus:',
      'Our Story timeline',
      'Photo gallery section',
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
