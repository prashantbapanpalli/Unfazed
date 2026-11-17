const r = require('express').Router();
const c = require('../controllers/analyticsController');
const { auth } = require('../middleware/authMiddleware');

r.get('/', auth('therapist'), c.overview);
module.exports = r;
