const { canAccess } = require('../services/entitlementService');

// Usage: router.post('/', auth('therapist'), requireFeature('active_client_cap'), handler)
// ctxFn(req) can pass extra context, e.g. { template: req.body.template }
module.exports = (featureKey, ctxFn = () => ({})) => async (req, res, next) => {
  try {
    const therapistId = req.user.role === 'therapist' ? req.user.id : req.user.therapistId;
    const result = await canAccess(therapistId, featureKey, ctxFn(req));
    if (!result.allowed) {
      return res.status(403).json({
        code: 'UPGRADE_REQUIRED',
        message: 'Your current plan does not include this. Please upgrade.',
        featureKey,
        tier: result.tier,
        limit: result.limit,
      });
    }
    req.entitlement = result;
    next();
  } catch (e) {
    next(e);
  }
};
