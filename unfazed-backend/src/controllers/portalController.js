const Client = require('../models/Client');
const Session = require('../models/Session');
const Payment = require('../models/Payment');
const ClientPackage = require('../models/ClientPackage');
const SessionNote = require('../models/SessionNote');
const Therapist = require('../models/Therapist');
const Message = require('../models/Message');
const ah = require('../utils/asyncHandler');

// Everything the CLIENT can see. Notes come ONLY from SessionNote.sharedForClient().
exports.me = ah(async (req, res) => {
  const [client, therapist] = await Promise.all([Client.findById(req.user.id), Therapist.findById(req.user.therapistId).select('name slug timezone')]);
  res.json({ client, therapist });
});
exports.sessions = ah(async (req, res) => res.json(await Session.find({ clientId: req.user.id }).sort({ start: -1 })));
exports.notes = ah(async (req, res) => res.json(await SessionNote.sharedForClient(req.user.id, req.user.therapistId)));
exports.payments = ah(async (req, res) => res.json(await Payment.find({ clientId: req.user.id, status: 'paid' }).sort({ paidAt: -1 })));
exports.packages = ah(async (req, res) => res.json(await ClientPackage.find({ clientId: req.user.id }).sort({ createdAt: -1 })));
exports.chatHistory = ah(async (req, res) =>
  res.json(await Message.find({ clientId: req.user.id, therapistId: req.user.therapistId }).sort({ createdAt: 1 }).limit(200))
);
