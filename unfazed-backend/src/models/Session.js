const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    duration: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show', 'expired'],
      default: 'confirmed',
    },
    // Unique + sparse: only active sessions hold a slotKey, which makes double booking impossible
    slotKey: { type: String, unique: true, sparse: true },
    amount: { type: Number, default: 0 },
    clientPackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientPackage' },
    expiresAt: Date,
    reminderSentAt: Date,
    followupSentAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
