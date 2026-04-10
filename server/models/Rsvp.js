import mongoose from 'mongoose';

const rsvpSchema = new mongoose.Schema({
  order:        { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
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

// Prevent duplicate RSVPs from same email for same order
rsvpSchema.index({ order: 1, email: 1 }, { unique: true, sparse: true });

export default mongoose.model('Rsvp', rsvpSchema);
