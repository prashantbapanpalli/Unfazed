const r = require('express').Router();
const c = require('../controllers/schedulingController');
const { auth } = require('../middleware/authMiddleware');

r.use(auth('therapist'));
r.get('/availability', c.getAvailability);
r.put('/availability', c.putAvailability);
r.get('/sessions', c.listSessions);
r.patch('/sessions/:id/status', c.updateStatus);
r.get('/packages', c.packagesCrud.list);
r.post('/packages', c.packagesCrud.create);
r.put('/packages/:id', c.packagesCrud.update);
r.delete('/packages/:id', c.packagesCrud.remove);
module.exports = r;
