const COUNTRY_HEADER_CANDIDATES = [
  'cf-ipcountry',
  'x-vercel-ip-country',
  'cloudfront-viewer-country',
  'x-nf-country',
  'x-appengine-country',
];

function normalizeCountryCode(value) {
  const code = `${value || ''}`.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : '';
}

export function getRequestCountry(req) {
  const configuredHeader = `${process.env.TRUSTED_COUNTRY_HEADER || ''}`.trim().toLowerCase();
  const headerNames = configuredHeader
    ? [configuredHeader]
    : COUNTRY_HEADER_CANDIDATES;

  for (const headerName of headerNames) {
    const countryCode = normalizeCountryCode(req.get(headerName));
    if (countryCode) return countryCode;
  }

  return '';
}

export function getRequestPricingRegion(req) {
  return { countryCode: getRequestCountry(req) };
}
