import mongoose from 'mongoose';

const placeholderSchema = new mongoose.Schema({
  key:          { type: String, required: true },        // e.g. "groomName"
  label:        { type: String, required: true },        // e.g. "Groom's Name"
  type:         { type: String, enum: ['text', 'date', 'time', 'image', 'textarea', 'color', 'url'], default: 'text' },
  required:     { type: Boolean, default: false },
  defaultValue: { type: String, default: '' },
}, { _id: false });

const templateSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  slug:         { type: String, required: true, unique: true, index: true },
  category:     { type: String, enum: ['launch', 'new', 'future'], default: 'launch' },
  description:  { type: String, required: true },
  envelope:     { type: String },                        // envelope animation description
  previewImage: { type: String, required: true },        // Cloudinary URL
  thumbnailImage: { type: String },                      // smaller preview
  colorScheme: {
    primary:    { type: String, default: '#B8924A' },
    secondary:  { type: String, default: '#2D2A26' },
    background: { type: String, default: '#FDFCFA' },
  },
  placeholders: [placeholderSchema],
  active:       { type: Boolean, default: true, index: true },
}, { timestamps: true });

export default mongoose.model('Template', templateSchema);
