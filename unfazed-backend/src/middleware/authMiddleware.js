const jwt = require('jsonwebtoken');

exports.sign = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
exports.verify = (token) => jwt.verify(token, process.env.JWT_SECRET);

// auth('therapist') | auth('client') | auth() for either role
exports.auth = (role) => (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (role && payload.role !== role) return res.status(403).json({ message: 'Forbidden' });
    req.user = payload; // { id, role, therapistId? }
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
