const r = require('express').Router();
const c = require('../controllers/portalController');
const s = require('../controllers/schedulingController');
const { auth } = require('../middleware/authMiddleware');

r.use(auth('client'));
r.get('/me', c.me);
r.get('/sessions', c.sessions);
r.post('/sessions/:id/cancel', s.clientCancel);
r.get('/notes', c.notes);
r.get('/payments', c.payments);
r.get('/packages', c.packages);
r.get('/chat', c.chatHistory);
module.exports = r;
