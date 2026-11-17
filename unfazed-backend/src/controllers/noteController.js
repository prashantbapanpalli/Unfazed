const SessionNote = require('../models/SessionNote');
const Client = require('../models/Client');
const ah = require('../utils/asyncHandler');
const { httpError } = require('../middleware/errorHandler');

exports.create = ah(async (req, res) => {
  const { clientId, sessionId, type, template = 'free', content } = req.body;
  if (!(await Client.exists({ _id: clientId, therapistId: req.user.id }))) throw httpError(404, 'Client not found');
  const note = await SessionNote.create({ therapistId: req.user.id, clientId, sessionId, type, template, content });
  res.status(201).json(note);
});

exports.listForClient = ah(async (req, res) => {
  res.json(await SessionNote.find({ therapistId: req.user.id, clientId: req.params.clientId }).sort({ createdAt: -1 }));
});

exports.update = ah(async (req, res) => {
  const note = await SessionNote.findOne({ _id: req.params.id, therapistId: req.user.id });
  if (!note) throw httpError(404, 'Note not found');
  for (const k of ['type', 'content', 'template']) if (req.body[k] !== undefined) note[k] = req.body[k];
  await note.save();
  res.json(note);
});
