const { validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  next();
};

exports.notFound = (req, res) => res.status(404).json({ message: 'Route not found' });

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  if (err.code === 11000) return res.status(409).json({ message: 'Already exists', detail: err.keyValue });
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  if (err.status) return res.status(err.status).json({ message: err.message, ...(err.extra || {}) });
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

exports.httpError = (status, message, extra) => Object.assign(new Error(message), { status, extra });
