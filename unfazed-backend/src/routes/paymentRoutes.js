const r = require('express').Router();
const c = require('../controllers/paymentController');
const { auth } = require('../middleware/authMiddleware');

r.post('/webhook', c.webhook); // called by Razorpay (no JWT, signature checked)
r.post('/verify', auth('client'), c.verify);
r.post('/mock-pay', auth('client'), c.mockPay);
r.get('/', auth('therapist'), c.list);
r.get('/:id/invoice', auth(), c.invoice);
module.exports = r;
