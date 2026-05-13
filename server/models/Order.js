import mongoose from 'mongoose';
import crypto from 'crypto';

const orderSchema = new mongoose.Schema({
  // Customer info
  customerName:  { type: String, required: true },
  customerEmail: { type: String, required: true, index: true },

  // Template chosen
  template:      { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
  templateName:  { type: String, index: true },

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

  // Story milestones — text + dates for the "Our Story" section
  storyMilestones: [{
    date:        { type: String },
    title:       { type: String },
    description: { type: String },
  }],

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
  musicPublicId: { type: String },                        // Cloudinary public_id for cleanup/reuse
  musicEnabled:  { type: Boolean, default: true },

  // Disabled placeholders — user chose to hide these fields
  disabledFields: [{ type: String }],                     // e.g. ["venueMapUrl", "message"]

  // Color overrides
  colorOverrides: {
    primary:    { type: String },
    secondary:  { type: String },
    background: { type: String },
  },

  // Payment
  paymentProvider:  { type: String, enum: ['paypal', 'manual'], default: 'paypal' },
  paypalOrderId:    { type: String, index: true },
  paypalCaptureId:  { type: String, index: true },
  amountPaid:       { type: String },                     // e.g. "89.00"
  currency:         { type: String, default: 'USD' },
  paymentStatus:    { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending', index: true },

  // Access tokens (magic link auth)
  editToken:        { type: String, unique: true, index: true },
  publicSlug:       { type: String, unique: true, index: true }, // the invitation URL slug
  invitationCode:   { type: String, unique: true, index: true, sparse: true }, // private owner code shown in email

  // Edit tracking
  editsRemaining:   { type: Number, default: 5 },
  nameEditsRemaining: { type: Number, default: 1 },   // 1 name correction allowed within grace period
  dateEditsRemaining: { type: Number, default: 2 },   // 2 date changes allowed total
  activatedAt:      { type: Date },                    // when payment was confirmed — starts grace period
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
  if (!this.invitationCode) {
    // Private owner code — short, separate from publicSlug, never appears in any guest-facing URL.
    this.invitationCode = crypto.randomBytes(5).toString('hex'); // 10 chars, e.g. "a1b2c3d4e5"
  }
  next();
});

// Grace period (in hours) after activation during which couple names can be corrected
orderSchema.statics.NAME_EDIT_GRACE_HOURS = 48;

// Fields that become immutable once the grace period expires.
// During the grace period, they can be edited if nameEditsRemaining > 0.
orderSchema.statics.LOCKED_FIELDS = ['groomName', 'brideName'];

// Set status to active when payment completes (no expiry — lives forever)
orderSchema.methods.activate = function () {
  this.status = 'active';
  this.paymentStatus = 'paid';
  this.activatedAt = new Date();
  return this.save();
};

// Check if we are within the name-edit grace period
orderSchema.methods.isInNameGracePeriod = function () {
  if (!this.activatedAt) return false;
  const graceMs = this.constructor.NAME_EDIT_GRACE_HOURS * 60 * 60 * 1000;
  return (Date.now() - this.activatedAt.getTime()) < graceMs;
};

// Check which locked fields a weddingDetails update is trying to change
orderSchema.methods.getLockedFieldViolations = function (newDetails) {
  if (this.status !== 'active') return [];
  const locked = this.constructor.LOCKED_FIELDS;
  const changes = [];
  for (const field of locked) {
    const original = (this.weddingDetails?.[field] || '').trim().toLowerCase();
    const incoming = (newDetails?.[field] || '').trim().toLowerCase();
    if (newDetails?.[field] !== undefined && incoming !== original) {
      changes.push(field);
    }
  }
  if (changes.length === 0) return [];

  // During grace period, allow if nameEditsRemaining > 0
  if (this.isInNameGracePeriod() && this.nameEditsRemaining > 0) {
    return []; // allowed — caller must decrement nameEditsRemaining
  }

  // Outside grace period or no name edits left: locked
  return changes;
};

// Detect which locked fields actually changed (for decrementing counter)
orderSchema.methods.getNameFieldChanges = function (newDetails) {
  const locked = this.constructor.LOCKED_FIELDS;
  const changes = [];
  for (const field of locked) {
    const original = (this.weddingDetails?.[field] || '').trim().toLowerCase();
    const incoming = (newDetails?.[field] || '').trim().toLowerCase();
    if (newDetails?.[field] !== undefined && incoming !== original) {
      changes.push(field);
    }
  }
  return changes;
};

// Detect if wedding date changed
orderSchema.methods.hasDateChanged = function (newDetails) {
  if (!newDetails?.weddingDate) return false;
  const original = this.weddingDetails?.weddingDate
    ? new Date(this.weddingDetails.weddingDate).toISOString().slice(0, 10)
    : '';
  const incoming = new Date(newDetails.weddingDate).toISOString().slice(0, 10);
  return incoming !== original;
};

// Check if edits are allowed
orderSchema.methods.canEdit = function () {
  if (this.status !== 'active') return false;
  if (this.editsRemaining <= 0) return false;
  return true;
};

export default mongoose.model('Order', orderSchema);
