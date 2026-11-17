const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Session = require('../models/Session');
const { canAccess } = require('../services/entitlementService');
const ah = require('../utils/asyncHandler');

const DAY = 24 * 3600 * 1000;

// All numbers come from MongoDB aggregation pipelines (not computed in the browser).
exports.overview = ah(async (req, res) => {
  const therapistId = new mongoose.Types.ObjectId(req.user.id);
  const depth = (await canAccess(req.user.id, 'analytics_depth')).value; // basic | full
  const months = depth === 'full' ? 12 : 3;
  const since = new Date();
  since.setMonth(since.getMonth() - months + 1, 1);
  since.setHours(0, 0, 0, 0);

  const revenueRaw = await Payment.aggregate([
    { $match: { therapistId, status: 'paid', paidAt: { $gte: since } } },
    { $group: { _id: '$paidMonth', gross: { $sum: '$amount' }, net: { $sum: '$net_amount' }, payments: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const revenueTrend = revenueRaw.map((r) => ({ month: r._id, gross: r.gross, net: r.net, payments: r.payments }));

  const activeRaw = await Session.aggregate([
    { $match: { therapistId, status: { $in: ['confirmed', 'completed'] }, start: { $gte: new Date(Date.now() - 90 * DAY) } } },
    { $group: { _id: '$clientId', sessions: { $sum: 1 } } },
  ]);
  const out = { depth, revenueTrend, activeClients: activeRaw.length };

  if (depth === 'full') {
    const statusRaw = await Session.aggregate([
      { $match: { therapistId, status: { $in: ['completed', 'no_show'] } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const completed = statusRaw.find((s) => s._id === 'completed')?.count || 0;
    const noShow = statusRaw.find((s) => s._id === 'no_show')?.count || 0;
    out.noShowRate = completed + noShow ? Math.round((noShow / (completed + noShow)) * 1000) / 10 : 0;
    out.sessionCounts = { completed, noShow };
    out.topClients = activeRaw.sort((a, b) => b.sessions - a.sessions).slice(0, 5).map((c) => ({ clientId: c._id, sessions: c.sessions }));
  }
  res.json(out);
});
