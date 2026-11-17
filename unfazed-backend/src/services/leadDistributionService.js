const Therapist = require('../models/Therapist');
const Lead = require('../models/Lead');
const { canAccess } = require('./entitlementService');

// Round-robin style: the eligible therapist (plan includes leads, monthly quota left)
// with the fewest leads this month gets the new lead.
exports.assign = async (lead) => {
  const therapists = await Therapist.find().select('_id');
  let best = null;
  for (const t of therapists) {
    const access = await canAccess(t._id, 'leads_per_month');
    if (!access.allowed) continue;
    if (!best || access.current < best.current) best = { id: t._id, current: access.current };
  }
  if (!best) return lead; // stays unassigned
  lead.assignedTherapistId = best.id;
  lead.status = 'assigned';
  await lead.save();
  return lead;
};

exports.create = async (data) => exports.assign(await Lead.create(data));
