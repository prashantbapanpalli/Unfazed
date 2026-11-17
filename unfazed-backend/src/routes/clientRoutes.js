const r = require('express').Router();
const c = require('../controllers/clientController');
const requireFeature = require('../middleware/entitlementMiddleware');
const { auth } = require('../middleware/authMiddleware');

r.use(auth('therapist'));
r.get('/', c.list);
r.post('/', requireFeature('active_client_cap'), c.create); // plan cap enforced centrally
r.get('/:id', c.get);
r.put('/:id', c.update);
module.exports = r;
