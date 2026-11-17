const Therapist = require('../models/Therapist');
const Package = require('../models/Package');
const Availability = require('../models/Availability');
const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
const Lead = require('../models/Lead');
const { accessMap } = require('../services/entitlementService');
const { slugify } = require('../utils/generateSlug');
const ah = require('../utils/asyncHandler');
const { httpError } = require('../middleware/errorHandler');

const EDITABLE = ['name', 'bio', 'specializations', 'languages', 'timezone', 'sessionRate', 'advancePercent', 'gstRegistered', 'gstin'];

exports.getProfile = ah(async (req, res) => res.json(await Therapist.findById(req.user.id)));

exports.updateProfile = ah(async (req, res) => {
  const t = await Therapist.findById(req.user.id);
  for (const k of EDITABLE) if (req.body[k] !== undefined) t[k] = req.body[k];
  if (req.body.slug && req.body.slug !== t.slug) {
    const slug = slugify(req.body.slug);
    if (await Therapist.exists({ slug, _id: { $ne: t._id } })) throw httpError(409, 'That link is already taken');
    t.slug = slug;
  }
  await t.save();
  res.json(t);
});

// What the logged-in therapist may do right now (drives the gated UI)
exports.features = ah(async (req, res) => res.json(await accessMap(req.user.id)));

exports.tiers = ah(async (_req, res) => res.json(await SubscriptionTierConfig.find().sort({ pricePerMonth: 1 }).lean()));

// Demo upgrade: a real product would charge the subscription first
exports.setTier = ah(async (req, res) => {
  if (!(await SubscriptionTierConfig.exists({ tier: req.body.tier }))) throw httpError(400, 'Unknown plan');
  const t = await Therapist.findByIdAndUpdate(req.user.id, { tier: req.body.tier }, { returnDocument: 'after' });
  res.json(t);
});

exports.leads = ah(async (req, res) => res.json(await Lead.find({ assignedTherapistId: req.user.id }).sort({ createdAt: -1 })));

// Public branded page data: /:slug  (nothing private is exposed)
exports.publicProfile = ah(async (req, res) => {
  const t = await Therapist.findOne({ slug: req.params.slug }).select('name slug bio specializations languages timezone sessionRate advancePercent gstRegistered');
  if (!t) throw httpError(404, 'Therapist not found');
  const [packages, av] = await Promise.all([
    Package.find({ therapistId: t._id, active: true }).select('name sessions ratePerSession validityDays'),
    Availability.findOne({ therapistId: t._id }).select('durations'),
  ]);
  res.json({ therapist: t, packages, durations: av?.durations || [60] });
});
