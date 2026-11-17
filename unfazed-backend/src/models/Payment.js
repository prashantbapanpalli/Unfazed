const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    type: { type: String, enum: ['session', 'package'], required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
    description: String,
    amount: { type: Number, required: true }, // taxable value (rupees)
    gst: { type: Number, default: 0 },
    total: { type: Number, required: true }, // what the client pays (amount + gst)
    platformFee: { type: Number, default: 0 },
    net_amount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'created' },
    gateway_order_id: { type: String, index: true },
    gateway_transaction_id: String,
    invoiceNumber: String,
    paidAt: Date,
    paidMonth: { type: String, index: true }, // 'YYYY-MM' bucket used by analytics aggregations
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
