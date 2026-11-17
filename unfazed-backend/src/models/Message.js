const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    sender: { type: String, enum: ['therapist', 'client'], required: true },
    text: { type: String, default: '' },
    attachment: { url: String, name: String },
    readAt: Date,
  },
  { timestamps: true }
);
messageSchema.index({ therapistId: 1, clientId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
