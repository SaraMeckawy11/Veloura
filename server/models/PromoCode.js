import mongoose from 'mongoose';

const promoRedemptionSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  status: { type: String, enum: ['reserved', 'redeemed', 'released'], default: 'reserved' },
  reservedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  redeemedAt: { type: Date },
  releasedAt: { type: Date },
}, { _id: false });

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  displayCode: { type: String, required: true, trim: true },
  discountPercent: { type: Number, required: true, min: 0, max: 100 },
  maxUses: { type: Number, required: true, min: 1 },
  active: { type: Boolean, default: true, index: true },
  expiresAt: { type: Date },
  redemptions: { type: [promoRedemptionSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('PromoCode', promoCodeSchema);
