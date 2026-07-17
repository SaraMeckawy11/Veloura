import { Router } from 'express';
import { getPricingCatalog } from '../data/pricingTiers.js';
import { getRequestPricingRegion } from '../utils/pricingRegion.js';

const router = Router();

router.get('/', (req, res) => {
  const catalog = getPricingCatalog(getRequestPricingRegion(req));

  res.set('Cache-Control', 'private, no-store');
  res.set('Vary', 'CF-IPCountry, X-Vercel-IP-Country, CloudFront-Viewer-Country, X-Nf-Country, X-AppEngine-Country');
  res.json(catalog);
});

export default router;
