const mongoose = require('mongoose');

const therapistSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    bio: { type: String, default: '' },
    specializations: [String],
    languages: [String],
    timezone: { type: String, default: 'Asia/Kolkata' },
    sessionRate: { type: Number, default: 0 }, // price for a 60 min session (rupees)
    advancePercent: { type: Number, default: 100, min: 0, max: 100 },
    gstRegistered: { type: Boolean, default: false },
    gstin: { type: String, default: '' },
    tier: { type: String, default: 'free' }, // refers to SubscriptionTierConfig.tier
  },
  { timestamps: true }
);

therapistSchema.methods.toJSON = function () {
  const o = this.toObject();
  delete o.password_hash;
  return o;
};

module.exports = mongoose.model('Therapist', therapistSchema);
