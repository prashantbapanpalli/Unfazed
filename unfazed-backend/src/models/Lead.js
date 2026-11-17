const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: String,
    phone: String,
    concern: String,
    assignedTherapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', index: true },
    status: { type: String, enum: ['assigned', 'unassigned', 'contacted'], default: 'unassigned' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lead', leadSchema);
