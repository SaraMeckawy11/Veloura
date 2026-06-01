import mongoose from 'mongoose';

const rsvpSchema = new mongoose.Schema({
  order:        { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  submissionId: { type: String, trim: true, maxlength: 128 },
  guestName:    { type: String, required: true },
  email:        { type: String },
  phone:        { type: String },
  attending:    { type: String, enum: ['yes', 'no', 'maybe'], required: true },
  plusOne:      { type: Boolean, default: false },
  plusOneName:  { type: String },
  guestCount:   { type: Number, default: 1, min: 1, max: 10 },
  dietaryPreferences: { type: String },
  message:      { type: String },
  respondedAt:  { type: Date, default: Date.now },
}, { timestamps: true });

// Retry-safe RSVP submissions without treating names, emails, or IP addresses
// as identity. A new form load receives a new submission ID and creates a new
// dashboard row, even when another guest entered the same name.
rsvpSchema.index({ order: 1, submissionId: 1 }, { unique: true, sparse: true });

export default mongoose.model('Rsvp', rsvpSchema);
