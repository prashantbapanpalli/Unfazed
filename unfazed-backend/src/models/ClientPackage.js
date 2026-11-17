const mongoose = require('mongoose');

const clientPackageSchema = new mongoose.Schema(
  {
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
    name: String,
    sessionsTotal: { type: Number, required: true },
    sessionsUsed: { type: Number, default: 0 },
    ratePerSession: Number,
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClientPackage', clientPackageSchema);
