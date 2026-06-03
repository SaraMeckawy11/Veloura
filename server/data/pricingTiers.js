export const DEFAULT_PRICING_TIER = 'signature';

export const PRICING_TIERS = [
  {
    id: 'essential',
    name: 'Essential',
    amount: '39.00',
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
    amount: '69.00',
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

export function getTierAmount(value, fallbackAmount = '99.00') {
  return getPricingTier(value).amount || fallbackAmount;
}
