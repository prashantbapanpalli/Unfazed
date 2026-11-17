const Client = require('../models/Client');
const Session = require('../models/Session');
const Payment = require('../models/Payment');
const SessionNote = require('../models/SessionNote');
const ClientPackage = require('../models/ClientPackage');
const { canAccess } = require('../services/entitlementService');
const ah = require('../utils/asyncHandler');
const { httpError } = require('../middleware/errorHandler');

// Sortable / filterable client list
exports.list = ah(async (req, res) => {
  const { q, status, tag, sort = 'createdAt', order = 'desc' } = req.query;
  const filter = { therapistId: req.user.id };
  if (status) filter.status = status;
  if (tag) filter.tags = tag;
  if (q) filter.$or = [{ name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { email: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }];
  const allowed = ['name', 'lastSessionAt', 'createdAt', 'status'];
  const clients = await Client.find(filter).sort({ [allowed.includes(sort) ? sort : 'createdAt']: order === 'asc' ? 1 : -1 });
  res.json(clients);
});

exports.create = ah(async (req, res) => {
  const { name, email, phone, tags, intake } = req.body;
  const client = await Client.create({ therapistId: req.user.id, name, email, phone, tags, intake });
  res.status(201).json(client);
});

// Aggregated profile: sessions + payments + notes + packages
exports.get = ah(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, therapistId: req.user.id });
  if (!client) throw httpError(404, 'Client not found');
  const f = { clientId: client._id, therapistId: req.user.id };
  const [sessions, payments, notes, packages] = await Promise.all([
    Session.find(f).sort({ start: -1 }),
    Payment.find(f).sort({ createdAt: -1 }),
    SessionNote.find(f).sort({ createdAt: -1 }),
    ClientPackage.find(f).sort({ createdAt: -1 }),
  ]);
  res.json({ client, sessions, payments, notes, packages });
});

exports.update = ah(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, therapistId: req.user.id });
  if (!client) throw httpError(404, 'Client not found');
  // Re-activating counts against the plan's active client cap
  if (req.body.status === 'active' && client.status !== 'active') {
    const a = await canAccess(req.user.id, 'active_client_cap');
    if (!a.allowed) throw httpError(403, 'Your plan has reached its active client limit', { code: 'UPGRADE_REQUIRED', featureKey: 'active_client_cap', limit: a.limit });
  }
  for (const k of ['name', 'email', 'phone', 'status', 'tags', 'intake']) if (req.body[k] !== undefined) client[k] = req.body[k];
  await client.save();
  res.json(client);
});
