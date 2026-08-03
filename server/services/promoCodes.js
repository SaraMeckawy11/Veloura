import PromoCode from '../models/PromoCode.js';

const RESERVATION_HOURS = 6;

export class PromoCodeError extends Error {
  constructor(message, status = 400, reason = 'invalid') {
    super(message);
    this.status = status;
    this.reason = reason;
  }
}

export function normalizePromoCode(value = '') {
  return `${value || ''}`.trim().toUpperCase();
}

export async function syncDefaultPromoCodes() {
  return PromoCode.updateOne(
    { code: 'NOUR' },
    {
      $setOnInsert: {
        code: 'NOUR',
        displayCode: 'Nour',
        discountPercent: 100,
        maxUses: 1,
        active: true,
      },
    },
    { upsert: true }
  );
}

function isReservationActive(redemption, now = new Date()) {
  return redemption.status === 'redeemed'
    || (redemption.status === 'reserved' && redemption.expiresAt > now);
}

export function getPromoUsage(promo, now = new Date()) {
  const used = (promo.redemptions || []).filter(redemption => redemption.status === 'redeemed').length;
  const reserved = (promo.redemptions || []).filter(redemption => (
    redemption.status === 'reserved' && redemption.expiresAt > now
  )).length;
  return { used, reserved, remaining: Math.max(0, promo.maxUses - used - reserved) };
}

export async function findAvailablePromoCode(rawCode) {
  const code = normalizePromoCode(rawCode);
  if (!code) throw new PromoCodeError('Enter a promo code.', 400, 'missing');
  await syncDefaultPromoCodes();

  const promo = await PromoCode.findOne({ code });
  if (!promo || !promo.active) {
    throw new PromoCodeError('This promo code is invalid or inactive.', 404, 'invalid');
  }
  const now = new Date();
  if (promo.expiresAt && promo.expiresAt <= now) {
    throw new PromoCodeError('This promo code has expired.', 409, 'expired');
  }
  const usage = getPromoUsage(promo, now);
  if (usage.remaining <= 0) {
    throw new PromoCodeError('This promo code has reached its usage limit.', 409, 'used');
  }
  return { promo, usage };
}

export async function reservePromoCode(rawCode, orderId) {
  const { promo } = await findAvailablePromoCode(rawCode);
  const now = new Date();
  const reservationExpiresAt = new Date(now.getTime() + RESERVATION_HOURS * 60 * 60 * 1000);

  const reservedPromo = await PromoCode.findOneAndUpdate(
    {
      _id: promo._id,
      active: true,
      $and: [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
        {
          $expr: {
            $lt: [
              {
                $size: {
                  $filter: {
                    input: { $ifNull: ['$redemptions', []] },
                    as: 'redemption',
                    cond: {
                      $or: [
                        { $eq: ['$$redemption.status', 'redeemed'] },
                        {
                          $and: [
                            { $eq: ['$$redemption.status', 'reserved'] },
                            { $gt: ['$$redemption.expiresAt', now] },
                          ],
                        },
                      ],
                    },
                  },
                },
              },
              '$maxUses',
            ],
          },
        },
      ],
    },
    {
      $push: {
        redemptions: {
          order: orderId,
          status: 'reserved',
          reservedAt: now,
          expiresAt: reservationExpiresAt,
        },
      },
    },
    { new: true }
  );

  if (!reservedPromo) {
    throw new PromoCodeError('This promo code was just claimed or is no longer available.', 409, 'used');
  }
  return reservedPromo;
}

export async function redeemPromoReservation(orderId) {
  if (!orderId) return null;
  return PromoCode.findOneAndUpdate(
    { 'redemptions.order': orderId },
    {
      $set: {
        'redemptions.$[redemption].status': 'redeemed',
        'redemptions.$[redemption].redeemedAt': new Date(),
      },
    },
    {
      new: true,
      arrayFilters: [{ 'redemption.order': orderId, 'redemption.status': 'reserved' }],
    }
  );
}

export async function releasePromoReservation(orderId) {
  if (!orderId) return null;
  return PromoCode.findOneAndUpdate(
    { 'redemptions.order': orderId },
    {
      $set: {
        'redemptions.$[redemption].status': 'released',
        'redemptions.$[redemption].releasedAt': new Date(),
      },
    },
    {
      new: true,
      arrayFilters: [{ 'redemption.order': orderId, 'redemption.status': 'reserved' }],
    }
  );
}

export function promoIsCurrentlyAvailable(promo, now = new Date()) {
  if (!promo?.active || (promo.expiresAt && promo.expiresAt <= now)) return false;
  return (promo.redemptions || []).filter(redemption => isReservationActive(redemption, now)).length < promo.maxUses;
}
