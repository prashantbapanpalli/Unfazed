const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true, index: true },
    name: { type: String, required: true },
    sessions: { type: Number, enum: [3, 6, 12], required: true },
    ratePerSession: { type: Number, required: true },
    validityDays: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Package', packageSchema);
