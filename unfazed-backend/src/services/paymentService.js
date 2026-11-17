const crypto = require('crypto');
const { client: rzp, mock } = require('../config/razorpay');
const Payment = require('../models/Payment');
const Session = require('../models/Session');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Package = require('../models/Package');
const ClientPackage = require('../models/ClientPackage');
const { getTierConfig } = require('./entitlementService');
const { bus } = require('./notificationService');

exports.isMock = mock;
const round2 = (n) => Math.round(n * 100) / 100;

// Price breakdown: GST only for GST-registered therapists. Rate comes from config (.env).
exports.price = (therapist, taxable) => {
  const rate = therapist.gstRegistered ? Number(process.env.GST_RATE || 0) : 0;
  const gst = round2((taxable * rate) / 100);
  return { amount: round2(taxable), gst, total: round2(taxable + gst) };
};

// ---- Gateway adapter (Razorpay or mock) - the rest of the app never touches Razorpay directly
exports.createOrder = async ({ total, receipt, notes }) => {
  if (mock) {
    return { id: `order_mock_${crypto.randomBytes(7).toString('hex')}`, amount: Math.round(total * 100), currency: 'INR', mock: true };
  }
  return rzp.orders.create({ amount: Math.round(total * 100), currency: 'INR', receipt, notes });
};

exports.verifySignature = (orderId, paymentId, signature) => {
  if (mock) return signature === 'mock_signature';
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature);
};

exports.verifyWebhook = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !rawBody) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
};

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Idempotent: webhook + client callback can both call this safely.
exports.confirmPayment = async (orderId, gatewayPaymentId) => {
  const payment = await Payment.findOneAndUpdate(
    { gateway_order_id: orderId, status: { $ne: 'paid' } },
    { status: 'paid', gateway_transaction_id: gatewayPaymentId, paidAt: new Date(), paidMonth: new Date().toISOString().slice(0, 7) },
    { returnDocument: 'after' }
  );
  if (!payment) return Payment.findOne({ gateway_order_id: orderId }); // already paid (or unknown)

  const cfg = await getTierConfig(payment.therapistId);
  const platformFee = round2((payment.amount * (cfg?.platformFeePercent || 0)) / 100);
  payment.platformFee = platformFee;
  payment.net_amount = round2(payment.amount - platformFee);
  payment.invoiceNumber = `INV-${new Date().getFullYear()}-${payment._id.toString().slice(-6).toUpperCase()}`;
  await payment.save();

  const [therapist, client] = await Promise.all([Therapist.findById(payment.therapistId), Client.findById(payment.clientId)]);

  if (payment.type === 'session' && payment.sessionId) {
    const s = await Session.findOneAndUpdate(
      { _id: payment.sessionId, status: 'pending_payment' },
      { status: 'confirmed', $unset: { expiresAt: 1 } },
      { returnDocument: 'after' }
    );
    if (s) bus.emit('booking.confirmed', { sessionId: s._id });
  } else if (payment.type === 'package') {
    const pkg = await Package.findById(payment.packageId);
    await ClientPackage.create({
      therapistId: payment.therapistId,
      clientId: payment.clientId,
      packageId: pkg._id,
      name: pkg.name,
      sessionsTotal: pkg.sessions,
      ratePerSession: pkg.ratePerSession,
      expiresAt: new Date(Date.now() + pkg.validityDays * 24 * 3600 * 1000),
    });
  }
  bus.emit('payment.paid', { client, therapist, payment });
  return payment;
};
