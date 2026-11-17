// Seeds plan config (always) and a demo therapist with realistic data.
// Run:  npm run seed      (demo login: sharma@example.com / password123)
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Tier = require('../models/SubscriptionTierConfig');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Session = require('../models/Session');
const Payment = require('../models/Payment');
const Availability = require('../models/Availability');
const Package = require('../models/Package');
const SessionNote = require('../models/SessionNote');
const { slotKey } = require('../services/schedulingService');

const TIERS = [
  { tier: 'free', displayName: 'Free', pricePerMonth: 0, platformFeePercent: 10, features: { activeClientCap: 3, noteTemplates: ['free'], analyticsDepth: 'basic', leadsPerMonth: 0, chat: true } },
  { tier: 'pro', displayName: 'Pro', pricePerMonth: 999, platformFeePercent: 5, features: { activeClientCap: 25, noteTemplates: ['free', 'soap'], analyticsDepth: 'basic', leadsPerMonth: 5, chat: true } },
  { tier: 'premium', displayName: 'Premium', pricePerMonth: 2499, platformFeePercent: 2, features: { activeClientCap: -1, noteTemplates: ['free', 'soap', 'dap'], analyticsDepth: 'full', leadsPerMonth: 20, chat: true } },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  for (const t of TIERS) await Tier.findOneAndUpdate({ tier: t.tier }, t, { upsert: true });
  console.log('Plan tiers seeded');

  await Promise.all([Therapist, Client, Session, Payment, Availability, Package, SessionNote].map((m) => m.deleteMany({})));

  const th = await Therapist.create({
    email: 'sharma@example.com', password_hash: await bcrypt.hash('password123', 10), name: 'Dr. Sharma', slug: 'dr-sharma',
    bio: 'Clinical psychologist helping adults with anxiety, burnout and relationship stress.',
    specializations: ['Anxiety', 'Burnout', 'Relationships'], languages: ['English', 'Hindi', 'Kannada'],
    sessionRate: 1500, advancePercent: 100, tier: 'premium', gstRegistered: false,
  });
  await Availability.create({
    therapistId: th._id, bufferMinutes: 10, durations: [30, 60, 90],
    weekly: [1, 2, 3, 4, 5].map((day) => ({ day, start: '10:00', end: '18:00' })),
  });
  await Package.create([
    { therapistId: th._id, name: 'Starter', sessions: 3, ratePerSession: 1400, validityDays: 60 },
    { therapistId: th._id, name: 'Steady', sessions: 6, ratePerSession: 1300, validityDays: 120 },
    { therapistId: th._id, name: 'Committed', sessions: 12, ratePerSession: 1200, validityDays: 240 },
  ]);

  const names = ['Aarav Patil', 'Meera Rao', 'Kiran Joshi', 'Sneha Desai', 'Rohan Naik'];
  const clients = await Client.create(
    names.map((n, i) => ({
      therapistId: th._id, name: n, email: `${n.split(' ')[0].toLowerCase()}@example.com`, phone: `98000000${i}0`,
      tags: i % 2 ? ['anxiety'] : ['burnout'], consent: { given: true, at: new Date() },
      intake: { age: 24 + i * 3, city: 'Dharwad', presentingConcern: 'Stress at work' },
    }))
  );

  const DAY = 86400000;
  for (let i = 0; i < 24; i++) {
    const client = clients[i % clients.length];
    const start = new Date(Date.now() - (i * 9 + 2) * DAY);
    start.setHours(11, 0, 0, 0);
    const status = i % 8 === 7 ? 'no_show' : 'completed';
    const s = await Session.create({ therapistId: th._id, clientId: client._id, start, end: new Date(+start + 3600000), duration: 60, status, amount: 1500, slotKey: slotKey(th._id, start) });
    if (status === 'completed') {
      await Payment.create({
        therapistId: th._id, clientId: client._id, type: 'session', sessionId: s._id, description: 'Therapy session (60 min)',
        amount: 1500, gst: 0, total: 1500, platformFee: 30, net_amount: 1470, status: 'paid', paidAt: start, paidMonth: start.toISOString().slice(0, 7),
        gateway_order_id: `order_seed_${i}`, gateway_transaction_id: `pay_seed_${i}`, invoiceNumber: `INV-SEED-${String(i).padStart(4, '0')}`,
      });
    }
  }
  await SessionNote.create([
    { therapistId: th._id, clientId: clients[0]._id, type: 'private', template: 'soap', content: '<p>S: reports poor sleep. O: restless. A: anxiety. P: CBT worksheet.</p>' },
    { therapistId: th._id, clientId: clients[0]._id, type: 'shared', template: 'free', content: '<p>Homework: 10 minutes of breathing practice each evening.</p>' },
  ]);
  console.log('Demo data ready. Login: sharma@example.com / password123  |  public page: /dr-sharma');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
