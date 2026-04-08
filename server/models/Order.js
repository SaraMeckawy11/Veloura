import mongoose from 'mongoose';
import crypto from 'crypto';

const orderSchema = new mongoose.Schema({
  // Customer info
  customerName:  { type: String, required: true },
  customerEmail: { type: String, required: true, index: true },

  // Template chosen
  template:      { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },

  // Wedding details — filled from the form
  weddingDetails: {
    groomName:    { type: String },
    brideName:    { type: String },
    weddingDate:  { type: Date },
    weddingTime:  { type: String },
    venue:        { type: String },
    venueAddress: { type: String },
    venueMapUrl:  { type: String },
    message:      { type: String },                       // custom message / invite text
    language:     { type: String, default: 'en' },
    secondLanguage: { type: String },                     // bilingual support
  },

  // Customizations — which placeholders are enabled/disabled + their values
  customizations: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },

  // Uploaded photos (Cloudinary URLs)
  photos: [{
    url:       { type: String, required: true },
    publicId:  { type: String, required: true },          // Cloudinary public_id for deletion
    label:     { type: String },                          // e.g. "couple_photo", "venue_photo"
  }],

  // Music
  musicUrl:      { type: String },                        // Cloudinary or external URL
  musicEnabled:  { type: Boolean, default: true },

  // Disabled placeholders — user chose to hide these fields
  disabledFields: [{ type: String }],                     // e.g. ["venueMapUrl", "message"]

  // Color overrides
  colorOverrides: {
    primary:    { type: String },
    secondary:  { type: String },
    background: { type: String },
  },

  // Payment (Paymob)
  paymobOrderId:    { type: String, index: true },        // Paymob's order ID
  paymobTransactionId: { type: String },                  // Paymob's transaction ID
  amountPaid:       { type: Number },                     // in piasters (EGP cents)
  currency:         { type: String, default: 'EGP' },
  paymentStatus:    { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending', index: true },

  // Access tokens (magic link auth)
  editToken:        { type: String, unique: true, index: true },
  publicSlug:       { type: String, unique: true, index: true }, // the invitation URL slug

  // Edit tracking
  editsRemaining:   { type: Number, default: 5 },
  editHistory: [{
    editedAt:    { type: Date, default: Date.now },
    fieldsChanged: [String],
  }],

  // Status
  status:           { type: String, enum: ['draft', 'active', 'expired', 'cancelled'], default: 'draft', index: true },
  expiresAt:        { type: Date },                       // 1 year from payment

  // Email tracking
  confirmationSent: { type: Boolean, default: false },
  remindersSent:    { type: Number, default: 0 },
}, { timestamps: true });

// Generate tokens before first save
orderSchema.pre('save', function (next) {
  if (!this.editToken) {
    this.editToken = crypto.randomBytes(32).toString('hex');
  }
  if (!this.publicSlug) {
    // Readable slug: first 4 chars of names + random 6 chars
    const namepart = (
      (this.weddingDetails?.groomName || '').slice(0, 2) +
      (this.weddingDetails?.brideName || '').slice(0, 2)
    ).toLowerCase().replace(/[^a-z]/g, '') || 'inv';
    this.publicSlug = `${namepart}-${crypto.randomBytes(3).toString('hex')}`;
  }
  next();
});

// Set expiry 1 year from now when payment completes
orderSchema.methods.activate = function () {
  this.status = 'active';
  this.paymentStatus = 'paid';
  this.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  return this.save();
};

// Check if edits are allowed
orderSchema.methods.canEdit = function () {
  if (this.status !== 'active') return false;
  if (this.editsRemaining <= 0) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
};

export default mongoose.model('Order', orderSchema);
