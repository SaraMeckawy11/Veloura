import crypto from 'crypto';
import { Router } from 'express';
import PromoCode from '../models/PromoCode.js';
import { getDiscountedTierPricing, normalizePricingTier } from '../data/pricingTiers.js';
import { getRequestPricingRegion } from '../utils/pricingRegion.js';
import {
  findAvailablePromoCode,
  getPromoUsage,
  normalizePromoCode,
  PromoCodeError,
  syncDefaultPromoCodes,
} from '../services/promoCodes.js';

const router = Router();

function promoAdminAuthorized(req) {
  const configured = `${process.env.PROMO_ADMIN_KEY || ''}`;
  const supplied = `${req.get('x-promo-admin-key') || ''}`;
  if (!configured || !supplied || configured.length !== supplied.length) return false;
  return crypto.timingSafeEqual(Buffer.from(configured), Buffer.from(supplied));
}

function requirePromoAdmin(req, res, next) {
  if (!process.env.PROMO_ADMIN_KEY) {
    return res.status(503).json({ error: 'Promo administration is not configured.' });
  }
  if (!promoAdminAuthorized(req)) {
    return res.status(401).json({ error: 'Invalid promo administration key.' });
  }
  next();
}

router.post('/validate', async (req, res) => {
  try {
    const { promo } = await findAvailablePromoCode(req.body.code);
    const pricingTier = normalizePricingTier(req.body.pricingTier);
    const pricing = getDiscountedTierPricing(
      pricingTier,
      promo.discountPercent,
      getRequestPricingRegion(req)
    );
    res.set('Cache-Control', 'private, no-store');
    res.json({
      valid: true,
      code: promo.displayCode,
      discountPercent: promo.discountPercent,
      pricing,
    });
  } catch (err) {
    const status = err instanceof PromoCodeError ? err.status : 500;
    res.status(status).json({
      valid: false,
      error: err.message || 'Could not validate promo code.',
      reason: err.reason,
    });
  }
});

router.get('/admin', requirePromoAdmin, async (_req, res) => {
  await syncDefaultPromoCodes();
  const promos = await PromoCode.find().sort({ createdAt: -1 }).lean();
  res.json({
    promos: promos.map(promo => ({
      code: promo.displayCode,
      discountPercent: promo.discountPercent,
      maxUses: promo.maxUses,
      active: promo.active,
      expiresAt: promo.expiresAt,
      ...getPromoUsage(promo),
    })),
  });
});

router.put('/admin/:code', requirePromoAdmin, async (req, res) => {
  const code = normalizePromoCode(req.params.code);
  const displayCode = `${req.body.displayCode || req.params.code || ''}`.trim();
  const discountPercent = Number(req.body.discountPercent);
  const maxUses = Number(req.body.maxUses);

  if (!code || !displayCode) return res.status(400).json({ error: 'A promo code is required.' });
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    return res.status(400).json({ error: 'discountPercent must be between 0 and 100.' });
  }
  if (!Number.isInteger(maxUses) || maxUses < 1) {
    return res.status(400).json({ error: 'maxUses must be a whole number of at least 1.' });
  }

  const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return res.status(400).json({ error: 'expiresAt must be a valid date or null.' });
  }

  const promo = await PromoCode.findOneAndUpdate(
    { code },
    {
      $set: {
        displayCode,
        discountPercent,
        maxUses,
        active: req.body.active !== false,
        expiresAt,
      },
      $setOnInsert: { code },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({
    promo: {
      code: promo.displayCode,
      discountPercent: promo.discountPercent,
      maxUses: promo.maxUses,
      active: promo.active,
      expiresAt: promo.expiresAt,
      ...getPromoUsage(promo),
    },
  });
});

export default router;
