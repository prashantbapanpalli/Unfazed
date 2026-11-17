const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    tags: [String],
    intake: {
      age: Number,
      gender: String,
      city: String,
      presentingConcern: String,
      history: String,
    },
    consent: { given: { type: Boolean, default: false }, at: Date, ip: String, version: { type: String, default: 'v1' } },
    lastSessionAt: Date,
  },
  { timestamps: true }
);
clientSchema.index({ therapistId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Client', clientSchema);
