const mongoose = require('mongoose');

// All plan limits and fees live here (database config) - nothing is hardcoded in code.
const tierSchema = new mongoose.Schema(
  {
    tier: { type: String, required: true, unique: true }, // free | pro | premium
    displayName: String,
    pricePerMonth: Number,
    platformFeePercent: { type: Number, default: 0 },
    features: {
      activeClientCap: Number, // -1 = unlimited
      noteTemplates: [String], // free | soap | dap
      analyticsDepth: String, // basic | full
      leadsPerMonth: Number, // 0 = no leads
      chat: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionTierConfig', tierSchema);
