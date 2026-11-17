const Razorpay = require('razorpay');

// If keys are missing we run in MOCK mode so the whole flow can be demoed locally.
const mock = !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET;
const client = mock
  ? null
  : new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

module.exports = { client, mock };
