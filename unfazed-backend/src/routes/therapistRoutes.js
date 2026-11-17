const r = require('express').Router();
const c = require('../controllers/therapistController');
const requireFeature = require('../middleware/entitlementMiddleware');
const { auth } = require('../middleware/authMiddleware');

r.get('/tiers', c.tiers);
r.use(auth('therapist'));
r.get('/profile', c.getProfile);
r.put('/profile', c.updateProfile);
r.get('/features', c.features);
r.put('/subscription', c.setTier);
r.get('/leads', requireFeature('leads_per_month', () => ({})), c.leads);
module.exports = r;
