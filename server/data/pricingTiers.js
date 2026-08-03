export const DEFAULT_PRICING_TIER = 'signature';

export const PRICING_TIERS = [
  {
    id: 'signature',
    name: 'Premium',
    amount: '79.00',
    oldAmount: '99.00',
    egyptAmount: '1999',
    oldEgyptAmount: '2499',
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
  const value = roundCurrency(amount);
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatEgp(amount) {
  const value = roundCurrency(amount);
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })} EGP`;
}

function roundCurrency(amount) {
  return Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
}

function formatDisplayAmount(amount, currency) {
  return currency === 'EGP' ? formatEgp(amount) : formatUsd(amount);
}

export function getDiscountedTierPricing(value, discountPercent = 0, region = {}) {
  const tier = getPricingTier(value);
  const useEgpDisplay = isEgyptRequest(region);
  const displayCurrency = useEgpDisplay ? 'EGP' : 'USD';
  const safePercent = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const paymentSubtotal = Number(getTierAmount(tier.id, tier.amount, region));
  const paymentTotal = roundCurrency(paymentSubtotal * (1 - safePercent / 100));
  const displaySubtotal = Number(useEgpDisplay ? tier.egyptAmount : tier.amount);
  const displayTotal = roundCurrency(displaySubtotal * (1 - safePercent / 100));
  const displayDiscount = roundCurrency(displaySubtotal - displayTotal);

  return {
    displayCurrency,
    paymentCurrency: 'USD',
    pricingRegion: useEgpDisplay ? 'egypt' : 'international',
    displayIsConverted: false,
    exchangeRate: useEgpDisplay ? readUsdToEgpRate() : 1,
    discountPercent: safePercent,
    subtotalAmount: paymentSubtotal.toFixed(2),
    discountAmount: roundCurrency(paymentSubtotal - paymentTotal).toFixed(2),
    amount: paymentTotal.toFixed(2),
    subtotalDisplayPrice: formatDisplayAmount(displaySubtotal, displayCurrency),
    discountDisplayPrice: formatDisplayAmount(displayDiscount, displayCurrency),
    displayPrice: formatDisplayAmount(displayTotal, displayCurrency),
  };
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
