import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:    { type: String, trim: true },

  // Password auth
  passwordHash: { type: String },
  passwordSalt: { type: String },

  // Role
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },

  // Link to orders
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],

  // Account status
  isActive:    { type: Boolean, default: true },
  lastLoginAt: { type: Date },

  // Password reset
  resetToken:     { type: String },
  resetTokenExp:  { type: Date },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();

  // Only hash if it looks like a plain password (not already hashed)
  if (this.passwordSalt) return next();

  this.passwordSalt = crypto.randomBytes(16).toString('hex');
  this.passwordHash = crypto
    .pbkdf2Sync(this.passwordHash, this.passwordSalt, 100000, 64, 'sha512')
    .toString('hex');
  next();
});

// Verify password
userSchema.methods.verifyPassword = function (password) {
  if (!this.passwordSalt || !this.passwordHash) return false;
  const hash = crypto
    .pbkdf2Sync(password, this.passwordSalt, 100000, 64, 'sha512')
    .toString('hex');
  return crypto.timingSafeEqual(Buffer.from(this.passwordHash, 'hex'), Buffer.from(hash, 'hex'));
};

// Set password helper
userSchema.methods.setPassword = function (password) {
  this.passwordSalt = crypto.randomBytes(16).toString('hex');
  this.passwordHash = crypto
    .pbkdf2Sync(password, this.passwordSalt, 100000, 64, 'sha512')
    .toString('hex');
};

// Generate password reset token
userSchema.methods.generateResetToken = function () {
  this.resetToken = crypto.randomBytes(32).toString('hex');
  this.resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return this.resetToken;
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.passwordSalt;
  delete obj.resetToken;
  delete obj.resetTokenExp;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
