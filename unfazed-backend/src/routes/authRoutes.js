const r = require('express').Router();
const { body } = require('express-validator');
const c = require('../controllers/authController');
const { validate } = require('../middleware/errorHandler');
const { auth } = require('../middleware/authMiddleware');

r.post('/register', [body('email').isEmail(), body('password').isLength({ min: 6 }), body('name').trim().notEmpty(), validate], c.register);
r.post('/login', [body('email').isEmail(), body('password').notEmpty(), validate], c.login);
r.get('/me', auth('therapist'), c.me);
module.exports = r;
