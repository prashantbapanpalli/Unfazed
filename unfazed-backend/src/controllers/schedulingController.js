const { formatInTimeZone } = require('date-fns-tz');
const Availability = require('../models/Availability');
const Session = require('../models/Session');
const Client = require('../models/Client');
const Package = require('../models/Package');
const ClientPackage = require('../models/ClientPackage');
const Payment = require('../models/Payment');
const Therapist = require('../models/Therapist');
const { openSlots, slotKey, HOLD_MS } = require('../services/schedulingService');
const pay = require('../services/paymentService');
const { bus } = require('../services/notificationService');
const ah = require('../utils/asyncHandler');
const { httpError } = require('../middleware/errorHandler');

const DURATIONS = [30, 45, 60, 90];

exports.getAvailability = ah(async (req, res) => {
  const av = (await Availability.findOne({ therapistId: req.user.id })) || (await Availability.create({ therapistId: req.user.id }));
  res.json(av);
});

exports.putAvailability = ah(async (req, res) => {
  const { weekly = [], overrides = [], blocked = [], bufferMinutes = 10, durations = [60] } = req.body;
  if (!durations.length || durations.some((d) => !DURATIONS.includes(d))) throw httpError(400, 'Durations must be 30, 45, 60 or 90');
  const av = await Availability.findOneAndUpdate(
    { therapistId: req.user.id },
    { weekly, overrides, blocked, bufferMinutes, durations },
    { returnDocument: 'after', upsert: true }
  );
  res.json(av);
});

// Therapist: sessions in a date range
exports.listSessions = ah(async (req, res) => {
  const f = { therapistId: req.user.id };
  if (req.query.from || req.query.to) f.start = { ...(req.query.from && { $gte: new Date(req.query.from) }), ...(req.query.to && { $lte: new Date(req.query.to) }) };
  if (req.query.status) f.status = req.query.status;
  const sessions = await Session.find(f).sort({ start: 1 }).populate('clientId', 'name email');
  res.json(sessions);
});

// Therapist: mark completed / no-show / cancelled
exports.updateStatus = ah(async (req, res) => {
  const { status } = req.body;
  if (!['completed', 'no_show', 'cancelled'].includes(status)) throw httpError(400, 'Invalid status');
  const s = await Session.findOne({ _id: req.params.id, therapistId: req.user.id });
  if (!s) throw httpError(404, 'Session not found');
  await applyStatus(s, status);
  res.json(s);
});

async function applyStatus(s, status) {
  s.status = status;
  if (status === 'cancelled') {
    s.slotKey = undefined; // frees the slot instantly
    if (s.clientPackageId) await ClientPackage.updateOne({ _id: s.clientPackageId, sessionsUsed: { $gt: 0 } }, { $inc: { sessionsUsed: -1 } });
  }
  if (status === 'completed') await Client.updateOne({ _id: s.clientId }, { lastSessionAt: s.start });
  await s.save();
}

// Client: book a slot (client token)
exports.book = ah(async (req, res) => {
  const therapist = await Therapist.findOne({ slug: req.params.slug });
  if (!therapist || String(therapist._id) !== String(req.user.therapistId)) throw httpError(403, 'Not your therapist');
  const duration = Number(req.body.duration) || 60;
  const start = new Date(req.body.start);
  if (isNaN(start)) throw httpError(400, 'Invalid start');

  // The slot must be one the server itself would offer (checks availability, buffer, overlaps, notice)
  const date = formatInTimeZone(start, therapist.timezone, 'yyyy-MM-dd');
  const open = await openSlots(therapist, date, duration);
  if (!open.includes(start.toISOString())) throw httpError(409, 'That slot is no longer available');

  const end = new Date(start.getTime() + duration * 60000);
  const base = { therapistId: therapist._id, clientId: req.user.id, start, end, duration, slotKey: slotKey(therapist._id, start) };

  // 1) Package credit? Book instantly with no payment.
  const active = await ClientPackage.find({ clientId: req.user.id, therapistId: therapist._id, expiresAt: { $gt: new Date() } }).sort({ expiresAt: 1 });
  const credit = active.find((p) => p.sessionsUsed < p.sessionsTotal); // use the package that expires first
  if (credit) {
    const claimed = await ClientPackage.findOneAndUpdate({ _id: credit._id, sessionsUsed: credit.sessionsUsed }, { $inc: { sessionsUsed: 1 } });
    if (claimed) {
      const session = await createSession({ ...base, status: 'confirmed', clientPackageId: credit._id });
      bus.emit('booking.confirmed', { sessionId: session._id });
      return res.status(201).json({ session, paidWithPackage: true });
    }
  }

  // 2) Price (rate scales with duration); advance payment taken at booking
  const full = (therapist.sessionRate * duration) / 60;
  const advance = (full * therapist.advancePercent) / 100;
  if (advance <= 0) {
    const session = await createSession({ ...base, status: 'confirmed', amount: 0 });
    bus.emit('booking.confirmed', { sessionId: session._id });
    return res.status(201).json({ session });
  }
  const price = pay.price(therapist, advance);
  const session = await createSession({ ...base, status: 'pending_payment', amount: price.total, expiresAt: new Date(Date.now() + HOLD_MS) });
  const order = await pay.createOrder({ total: price.total, receipt: String(session._id), notes: { sessionId: String(session._id) } });
  const payment = await Payment.create({
    therapistId: therapist._id,
    clientId: req.user.id,
    type: 'session',
    sessionId: session._id,
    description: `Therapy session (${duration} min) on ${formatInTimeZone(start, therapist.timezone, 'dd MMM yyyy, HH:mm')}`,
    ...price,
    gateway_order_id: order.id,
  });
  res.status(201).json({ session, payment, order, keyId: process.env.RAZORPAY_KEY_ID || null, mock: pay.isMock });
});

async function createSession(doc) {
  try {
    return await Session.create(doc);
  } catch (e) {
    if (e.code === 11000) throw httpError(409, 'That slot was just taken. Please pick another.'); // double booking prevented by the unique slotKey
    throw e;
  }
}

// Client: cancel own session (at least 24h before)
exports.clientCancel = ah(async (req, res) => {
  const s = await Session.findOne({ _id: req.params.id, clientId: req.user.id });
  if (!s) throw httpError(404, 'Session not found');
  if (!['confirmed', 'pending_payment'].includes(s.status)) throw httpError(400, 'Session cannot be cancelled');
  if (s.start.getTime() - Date.now() < 24 * 3600 * 1000) throw httpError(400, 'Sessions can only be cancelled 24 hours ahead');
  await applyStatus(s, 'cancelled');
  res.json(s);
});

// Package listing for therapist management
exports.packagesCrud = {
  list: ah(async (req, res) => res.json(await Package.find({ therapistId: req.user.id }).sort({ sessions: 1 }))),
  create: ah(async (req, res) => res.status(201).json(await Package.create({ ...req.body, therapistId: req.user.id }))),
  update: ah(async (req, res) => {
    const p = await Package.findOneAndUpdate({ _id: req.params.id, therapistId: req.user.id }, req.body, { returnDocument: 'after' });
    if (!p) throw httpError(404, 'Package not found');
    res.json(p);
  }),
  remove: ah(async (req, res) => {
    // Soft delete: clients who already bought it keep their credits
    const p = await Package.findOneAndUpdate({ _id: req.params.id, therapistId: req.user.id }, { active: false }, { returnDocument: 'after' });
    if (!p) throw httpError(404, 'Package not found');
    res.json(p);
  }),
};
