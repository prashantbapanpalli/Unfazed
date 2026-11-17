const r = require('express').Router();
const { body } = require('express-validator');
const t = require('../controllers/therapistController');
const p = require('../controllers/publicController');
const s = require('../controllers/schedulingController');
const pay = require('../controllers/paymentController');
const { auth } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/errorHandler');

r.post('/leads', [body('name').trim().notEmpty(), validate], p.lead);
r.get('/:slug', t.publicProfile);
r.get('/:slug/slots', p.slots);
r.post('/:slug/clients', [body('name').trim().notEmpty(), body('email').isEmail(), validate], p.intake);
r.post('/:slug/book', auth('client'), s.book);
r.post('/:slug/packages/:packageId/buy', auth('client'), pay.buyPackage);
module.exports = r;
