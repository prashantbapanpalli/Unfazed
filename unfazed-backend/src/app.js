const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || true }));
// rawBody is kept for Razorpay webhook signature verification
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/therapist', require('./routes/therapistRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/scheduling', require('./routes/schedulingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/portal', require('./routes/portalRoutes'));

app.use(notFound);
app.use(errorHandler);
module.exports = app;
