const r = require('express').Router();
const c = require('../controllers/noteController');
const requireFeature = require('../middleware/entitlementMiddleware');
const { auth } = require('../middleware/authMiddleware');

r.use(auth('therapist'));
r.post('/', requireFeature('note_templates', (req) => ({ template: req.body.template || 'free' })), c.create);
r.get('/client/:clientId', c.listForClient);
r.put('/:id', requireFeature('note_templates', (req) => ({ template: req.body.template })), c.update);
module.exports = r;
