const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Lead = require('../models/Lead');
const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');

/**
 * THE single source of truth for feature access.
 * Every gated route/component asks canAccess(therapistId, featureKey, ctx) - nobody
 * compares tier names directly. Limits come from the SubscriptionTierConfig collection.
 */
const rules = {
  active_client_cap: async (cfg, therapistId, ctx) => {
    const limit = cfg.features.activeClientCap;
    const current = ctx.current ?? (await Client.countDocuments({ therapistId, status: 'active' }));
    return { allowed: limit < 0 || current < limit, limit, current };
  },
  note_templates: async (cfg, _t, ctx) => {
    const list = cfg.features.noteTemplates || [];
    return { allowed: ctx.template ? list.includes(ctx.template) : list.length > 0, limit: list };
  },
  analytics_depth: async (cfg) => ({ allowed: true, value: cfg.features.analyticsDepth }),
  leads_per_month: async (cfg, therapistId) => {
    const limit = cfg.features.leadsPerMonth;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const current = await Lead.countDocuments({ assignedTherapistId: therapistId, createdAt: { $gte: monthStart } });
    return { allowed: limit > 0 && current < limit, limit, current };
  },
  chat: async (cfg) => ({ allowed: !!cfg.features.chat }),
};

exports.featureKeys = Object.keys(rules);

exports.getTierConfig = async (therapistId) => {
  const t = await Therapist.findById(therapistId).select('tier');
  if (!t) return null;
  return SubscriptionTierConfig.findOne({ tier: t.tier }).lean();
};

exports.canAccess = async (therapistId, featureKey, ctx = {}) => {
  const cfg = await exports.getTierConfig(therapistId);
  if (!cfg) return { allowed: false, featureKey, reason: 'no_tier_config' };
  if (!rules[featureKey]) return { allowed: false, featureKey, reason: 'unknown_feature' };
  const result = await rules[featureKey](cfg, therapistId, ctx);
  return { featureKey, tier: cfg.tier, ...result };
};

// Everything the frontend needs to render gated UI, in one call
exports.accessMap = async (therapistId) => {
  const cfg = await exports.getTierConfig(therapistId);
  const access = {};
  for (const key of exports.featureKeys) access[key] = await exports.canAccess(therapistId, key);
  return { tier: cfg?.tier, displayName: cfg?.displayName, platformFeePercent: cfg?.platformFeePercent, access };
};
