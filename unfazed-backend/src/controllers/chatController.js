const Message = require('../models/Message');
const Client = require('../models/Client');
const ah = require('../utils/asyncHandler');
const { httpError } = require('../middleware/errorHandler');

exports.history = ah(async (req, res) => {
  if (!(await Client.exists({ _id: req.params.clientId, therapistId: req.user.id }))) throw httpError(404, 'Client not found');
  res.json(await Message.find({ therapistId: req.user.id, clientId: req.params.clientId }).sort({ createdAt: 1 }).limit(200));
});

// Local disk now; swap this service for AWS S3 in production (same interface: returns a URL)
exports.upload = ah(async (req, res) => {
  if (!req.file) throw httpError(400, 'No file');
  res.status(201).json({ url: `/uploads/${req.file.filename}`, name: req.file.originalname });
});
