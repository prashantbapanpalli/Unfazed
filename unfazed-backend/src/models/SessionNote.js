const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    type: { type: String, enum: ['private', 'shared'], required: true },
    template: { type: String, enum: ['free', 'soap', 'dap'], default: 'free' },
    content: { type: String, default: '' }, // rich text (HTML) from the editor
  },
  { timestamps: true }
);

// The ONLY way client-facing code reads notes: private notes can never come out of this.
noteSchema.statics.sharedForClient = function (clientId, therapistId) {
  return this.find({ clientId, therapistId, type: 'shared' })
    .select('sessionId template content createdAt')
    .sort({ createdAt: -1 })
    .lean();
};

module.exports = mongoose.model('SessionNote', noteSchema);
