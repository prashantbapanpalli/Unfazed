const r = require('express').Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const c = require('../controllers/chatController');
const { auth } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../../uploads'),
    filename: (_req, file, cb) => cb(null, `${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /image\/|application\/pdf/.test(file.mimetype)),
});

r.get('/:clientId', auth('therapist'), c.history);
r.post('/upload', auth(), upload.single('file'), c.upload);
module.exports = r;
