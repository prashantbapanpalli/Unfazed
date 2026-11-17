const mongoose = require('mongoose');

const windowSchema = new mongoose.Schema({ start: String, end: String }, { _id: false }); // "HH:mm"

const availabilitySchema = new mongoose.Schema(
  {
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true, unique: true },
    // recurring weekly template (day: 0 = Sunday ... 6 = Saturday), in the therapist's timezone
    weekly: [{ day: Number, start: String, end: String, _id: false }],
    // one-time overrides for a specific date; empty slots = day off
    overrides: [{ date: String, slots: [windowSchema], _id: false }],
    blocked: [{ start: Date, end: Date, _id: false }],
    bufferMinutes: { type: Number, default: 10 },
    durations: { type: [Number], default: [60] }, // allowed: 30, 45, 60, 90
  },
  { timestamps: true }
);

module.exports = mongoose.model('Availability', availabilitySchema);
