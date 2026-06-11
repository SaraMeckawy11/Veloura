import mongoose from 'mongoose';

// A single guest's response. Many of these live inside one invitation's RSVP
// document (see rsvpSchema below).
const responseSchema = new mongoose.Schema({
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
}, { _id: true, timestamps: true });

// One RSVP document per invitation (order). Every guest response is appended to
// the `responses` array, so an invitation always maps to exactly one row in the
// collection that gets updated as new responses arrive. When the same guest
// re-submits (matched by submissionId) their existing response is updated in
// place rather than duplicated.
const rsvpSchema = new mongoose.Schema({
  order:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, index: true },
  responses: { type: [responseSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('Rsvp', rsvpSchema);
