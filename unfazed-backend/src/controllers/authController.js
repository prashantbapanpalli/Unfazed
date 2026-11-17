const bcrypt = require('bcryptjs');
const Therapist = require('../models/Therapist');
const Availability = require('../models/Availability');
const generateSlug = require('../utils/generateSlug');
const { sign } = require('../middleware/authMiddleware');
const ah = require('../utils/asyncHandler');
const { httpError } = require('../middleware/errorHandler');

exports.register = ah(async (req, res) => {
  const { email, password, name, bio, specializations, languages } = req.body;
  if (await Therapist.exists({ email: email.toLowerCase() })) throw httpError(409, 'Email already registered');
  const therapist = await Therapist.create({
    email,
    name,
    bio,
    specializations,
    languages,
    password_hash: await bcrypt.hash(password, 10),
    slug: await generateSlug(name),
  });
  await Availability.create({ therapistId: therapist._id, durations: [60] });
  res.status(201).json({ token: sign({ id: therapist._id, role: 'therapist' }), therapist });
});

exports.login = ah(async (req, res) => {
  const therapist = await Therapist.findOne({ email: req.body.email.toLowerCase() });
  if (!therapist || !(await bcrypt.compare(req.body.password, therapist.password_hash))) throw httpError(401, 'Invalid email or password');
  res.json({ token: sign({ id: therapist._id, role: 'therapist' }), therapist });
});

exports.me = ah(async (req, res) => {
  const therapist = await Therapist.findById(req.user.id);
  if (!therapist) throw httpError(404, 'Not found');
  res.json(therapist);
});
