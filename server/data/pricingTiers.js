export const DEFAULT_PRICING_TIER = 'signature';

export const PRICING_TIERS = [
  {
    id: 'essential',
    name: 'Essential',
    amount: '39.00',
    oldAmount: '59.00',
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
    amount: '69.00',
    oldAmount: '89.00',
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

export function getTierAmount(value, fallbackAmount = '99.00') {
  return getPricingTier(value).amount || fallbackAmount;
}

function readUsdToEgpRate() {
  const raw = process.env.USD_TO_EGP_RATE || process.env.PRICE_USD_TO_EGP_RATE || '53';
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 53;
}

function isEgyptRequest({ countryCode, timezone, locale } = {}) {
  const country = `${countryCode || ''}`.trim().toUpperCase();
  const tz = `${timezone || ''}`.trim().toLowerCase();
  const loc = `${locale || ''}`.trim().toLowerCase();
  return country === 'EG' || tz === 'africa/cairo' || /(^|[-_])eg($|[-_])/.test(loc);
}

function formatUsd(amount) {
  return `$${Number(amount).toFixed(0)}`;
}

function formatEgp(amount, rate) {
  const converted = Math.round((Number(amount) * rate) / 10) * 10;
  return `EGP ${converted.toLocaleString('en-US')}`;
}

export function getPricingCatalog(region = {}) {
  const rate = readUsdToEgpRate();
  const useEgpDisplay = isEgyptRequest(region);
  const displayCurrency = useEgpDisplay ? 'EGP' : 'USD';

  return {
    displayCurrency,
    paymentCurrency: 'USD',
    exchangeRate: useEgpDisplay ? rate : 1,
    displayIsConverted: useEgpDisplay,
    tiers: PRICING_TIERS.map(tier => ({
      id: tier.id,
      name: tier.name,
      amount: tier.amount,
      displayPrice: useEgpDisplay ? formatEgp(tier.amount, rate) : formatUsd(tier.amount),
      oldDisplayPrice: useEgpDisplay ? formatEgp(tier.oldAmount, rate) : formatUsd(tier.oldAmount),
      sections: tier.sections,
    })),
  };
}
