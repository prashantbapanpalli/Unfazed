const Payment = require('../models/Payment');
const Package = require('../models/Package');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const pay = require('../services/paymentService');
const invoice = require('../services/invoiceService');
const ah = require('../utils/asyncHandler');
const { httpError } = require('../middleware/errorHandler');

// Client buys a package (3/6/12 sessions)
exports.buyPackage = ah(async (req, res) => {
  const therapist = await Therapist.findOne({ slug: req.params.slug });
  if (!therapist || String(therapist._id) !== String(req.user.therapistId)) throw httpError(403, 'Not your therapist');
  const pkg = await Package.findOne({ _id: req.params.packageId, therapistId: therapist._id, active: true });
  if (!pkg) throw httpError(404, 'Package not found');
  const price = pay.price(therapist, pkg.sessions * pkg.ratePerSession);
  const order = await pay.createOrder({ total: price.total, receipt: `pkg_${pkg._id}`, notes: { packageId: String(pkg._id) } });
  const payment = await Payment.create({
    therapistId: therapist._id,
    clientId: req.user.id,
    type: 'package',
    packageId: pkg._id,
    description: `${pkg.name} (${pkg.sessions} sessions)`,
    ...price,
    gateway_order_id: order.id,
  });
  res.status(201).json({ payment, order, keyId: process.env.RAZORPAY_KEY_ID || null, mock: pay.isMock });
});

// Client-side callback after checkout (signature verified server side)
exports.verify = ah(async (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sig } = req.body;
  const own = await Payment.findOne({ gateway_order_id: orderId, clientId: req.user.id });
  if (!own) throw httpError(404, 'Payment not found');
  if (!pay.verifySignature(orderId, paymentId, sig)) throw httpError(400, 'Invalid payment signature');
  res.json(await pay.confirmPayment(orderId, paymentId));
});

// The source of truth: Razorpay webhook (signature checked against the RAW body)
exports.webhook = ah(async (req, res) => {
  if (!pay.verifyWebhook(req.rawBody, req.headers['x-razorpay-signature'])) throw httpError(400, 'Invalid webhook signature');
  const { event, payload } = req.body;
  if (event === 'payment.captured' || event === 'order.paid') {
    const entity = payload.payment?.entity;
    if (entity) await pay.confirmPayment(entity.order_id, entity.id);
  } else if (event === 'payment.failed') {
    const entity = payload.payment?.entity;
    if (entity) await Payment.updateOne({ gateway_order_id: entity.order_id, status: 'created' }, { status: 'failed' });
  }
  res.json({ received: true });
});

// MOCK mode only: simulates the gateway webhook so the demo works without Razorpay keys
exports.mockPay = ah(async (req, res) => {
  if (!pay.isMock) throw httpError(404, 'Not available');
  const own = await Payment.findOne({ gateway_order_id: req.body.orderId, clientId: req.user.id });
  if (!own) throw httpError(404, 'Payment not found');
  res.json(await pay.confirmPayment(req.body.orderId, `pay_mock_${Date.now()}`));
});

exports.list = ah(async (req, res) => res.json(await Payment.find({ therapistId: req.user.id }).sort({ createdAt: -1 }).populate('clientId', 'name email')));

// Invoice PDF for therapist or the paying client
exports.invoice = ah(async (req, res) => {
  const f = { _id: req.params.id, status: 'paid' };
  if (req.user.role === 'therapist') f.therapistId = req.user.id;
  else f.clientId = req.user.id;
  const payment = await Payment.findOne(f);
  if (!payment) throw httpError(404, 'Invoice not found');
  const [therapist, client] = await Promise.all([Therapist.findById(payment.therapistId), Client.findById(payment.clientId)]);
  invoice.stream(res, { payment, therapist, client });
});
