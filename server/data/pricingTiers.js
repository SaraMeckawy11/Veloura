export const DEFAULT_PRICING_TIER = 'signature';

export const PRICING_TIERS = [
  {
    id: 'essential',
    name: 'Essential',
    amount: '59.00',
    oldAmount: '69.00',
    egyptAmount: '1200',
    oldEgyptAmount: '1500',
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
    name: 'Premium',
    amount: '69.00',
    oldAmount: '79.00',
    egyptAmount: '1500',
    oldEgyptAmount: '1900',
    sections: {
      countdown: true,
      coupleMessage: true,
      story: true,
      gallery: true,
      rsvp: true,
      music: false,
    },
  },
  {
    id: 'luxe',
    name: 'Signature (Custom)',
    amount: '169.00',
    oldAmount: '199.00',
    egyptAmount: '4900',
    oldEgyptAmount: '5900',
    pricePrefix: 'From ',
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
  return PRICING_TIERS.some(tier => tier.id === value) ? value : DEFAULT_PRICING_TIER;
}

export function getPricingTier(value) {
  const normalized = normalizePricingTier(value);
  return PRICING_TIERS.find(tier => tier.id === normalized) || PRICING_TIERS[1];
}

export function tierAllows(value, section) {
  return Boolean(getPricingTier(value).sections?.[section]);
}

export function getTierAmount(value, fallbackAmount = '99.00', region = {}) {
  const tier = getPricingTier(value);
  if (isEgyptRequest(region) && tier.egyptAmount) {
    return (Number(tier.egyptAmount) / readUsdToEgpRate()).toFixed(2);
  }
  return tier.amount || fallbackAmount;
}

function readUsdToEgpRate() {
  const raw = process.env.USD_TO_EGP_RATE || process.env.PRICE_USD_TO_EGP_RATE || '53';
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 53;
}

function isEgyptRequest({ countryCode } = {}) {
  const country = `${countryCode || ''}`.trim().toUpperCase();
  return country === 'EG';
}

function formatUsd(amount) {
  return `$${Number(amount).toFixed(0)}`;
}

function formatEgp(amount) {
  return `${Number(amount).toLocaleString('en-US')} EGP`;
}

export function getPricingCatalog(region = {}) {
  const useEgpDisplay = isEgyptRequest(region);
  const displayCurrency = useEgpDisplay ? 'EGP' : 'USD';
  const exchangeRate = useEgpDisplay ? readUsdToEgpRate() : 1;

  return {
    displayCurrency,
    paymentCurrency: 'USD',
    pricingRegion: useEgpDisplay ? 'egypt' : 'international',
    resolvedCountry: `${region.countryCode || ''}`.trim().toUpperCase() || null,
    displayIsConverted: false,
    exchangeRate,
    tiers: PRICING_TIERS.map(tier => ({
      id: tier.id,
      name: tier.name,
      amount: tier.amount,
      displayPrice: `${tier.pricePrefix || ''}${useEgpDisplay ? formatEgp(tier.egyptAmount) : formatUsd(tier.amount)}`,
      oldDisplayPrice: `${tier.pricePrefix || ''}${useEgpDisplay ? formatEgp(tier.oldEgyptAmount) : formatUsd(tier.oldAmount)}`,
      sections: tier.sections,
    })),
  };
}
