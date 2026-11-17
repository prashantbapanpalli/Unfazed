const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    event: String,
    channel: { type: String, enum: ['email', 'whatsapp', 'sms'] },
    to: String,
    subject: String,
    body: String,
    status: { type: String, enum: ['sent', 'logged', 'failed'], default: 'logged' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
