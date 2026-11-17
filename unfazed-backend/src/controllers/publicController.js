const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const { canAccess } = require('../services/entitlementService');
const { openSlots } = require('../services/schedulingService');
const leadService = require('../services/leadDistributionService');
const { sign } = require('../middleware/authMiddleware');
const ah = require('../utils/asyncHandler');
const { httpError } = require('../middleware/errorHandler');

const bySlug = async (slug) => {
  const t = await Therapist.findOne({ slug });
  if (!t) throw httpError(404, 'Therapist not found');
  return t;
};
exports.bySlug = bySlug;

// Open slots for a date (therapist timezone date), as UTC ISO strings
exports.slots = ah(async (req, res) => {
  const t = await bySlug(req.params.slug);
  const duration = Number(req.query.duration) || 60;
  res.json({ timezone: t.timezone, duration, slots: await openSlots(t, req.query.date, duration) });
});

// Client intake + consent from the branded page. Creates (or updates) the client and returns a client token.
exports.intake = ah(async (req, res) => {
  const t = await bySlug(req.params.slug);
  const { name, email, phone, intake, consent } = req.body;
  if (consent !== true) throw httpError(400, 'Consent is required before booking');

  let client = await Client.findOne({ therapistId: t._id, email: email.toLowerCase() });
  if (!client) {
    const a = await canAccess(t._id, 'active_client_cap');
    if (!a.allowed) throw httpError(403, 'This therapist is not accepting new clients right now', { code: 'NOT_ACCEPTING' });
    client = new Client({ therapistId: t._id, email, name });
  }
  client.name = name;
  client.phone = phone;
  client.intake = intake;
  client.consent = { given: true, at: new Date(), ip: req.ip, version: 'v1' }; // auditable record
  await client.save();
  res.status(201).json({ token: sign({ id: client._id, role: 'client', therapistId: t._id }), client });
});

// "Find a therapist" lead form
exports.lead = ah(async (req, res) => {
  const lead = await leadService.create(req.body);
  res.status(201).json({ status: lead.status });
});
