import { Router } from 'express';
import { getPricingCatalog } from '../data/pricingTiers.js';

const router = Router();

function readCountry(req) {
  return req.headers['cf-ipcountry']
    || req.headers['x-vercel-ip-country']
    || req.headers['x-country-code']
    || req.headers['x-appengine-country']
    || req.query.country
    || '';
}

router.get('/', (req, res) => {
  const catalog = getPricingCatalog({
    countryCode: readCountry(req),
    timezone: req.query.timezone,
    locale: req.query.locale || req.headers['accept-language'],
  });

  res.json(catalog);
});

export default router;
