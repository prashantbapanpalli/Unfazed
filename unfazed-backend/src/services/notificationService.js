const { EventEmitter } = require('events');
const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const Session = require('../models/Session');
const Client = require('../models/Client');
const Therapist = require('../models/Therapist');

// Event-driven: business code only emits domain events. Channels are isolated below.
const bus = new EventEmitter();
exports.bus = bus;

const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: +process.env.SMTP_PORT || 587,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;

async function sendEmail(event, to, subject, body) {
  if (!to) return;
  let status = 'logged';
  if (transporter) {
    try {
      await transporter.sendMail({ from: process.env.SMTP_USER || 'no-reply@unfazed.in', to, subject, text: body });
      status = 'sent';
    } catch (e) {
      status = 'failed';
    }
  }
  await Notification.create({ event, channel: 'email', to, subject, body, status });
}

// WhatsApp Business API needs business approval, so this layer only logs/queues (stub).
async function sendWhatsApp(event, phone, body) {
  if (!phone) return;
  await Notification.create({ event, channel: 'whatsapp', to: phone, body, status: 'logged' });
}

const when = (d, tz) => new Date(d).toLocaleString('en-IN', { timeZone: tz, dateStyle: 'medium', timeStyle: 'short' });

async function load(sessionId) {
  const s = await Session.findById(sessionId);
  const [client, therapist] = await Promise.all([Client.findById(s.clientId), Therapist.findById(s.therapistId)]);
  return { s, client, therapist };
}

bus.on('booking.confirmed', async ({ sessionId }) => {
  const { s, client, therapist } = await load(sessionId);
  const text = `Hi ${client.name}, your session with ${therapist.name} is confirmed for ${when(s.start, therapist.timezone)}.`;
  await Promise.all([
    sendEmail('booking.confirmed', client.email, 'Session confirmed', text),
    sendWhatsApp('booking.confirmed', client.phone, text),
    sendEmail('booking.confirmed', therapist.email, 'New booking', `${client.name} booked ${when(s.start, therapist.timezone)}.`),
  ]);
});

bus.on('session.reminder', async ({ sessionId }) => {
  const { s, client, therapist } = await load(sessionId);
  const text = `Reminder: you have a session with ${therapist.name} tomorrow at ${when(s.start, therapist.timezone)}.`;
  await Promise.all([sendEmail('session.reminder', client.email, 'Session reminder', text), sendWhatsApp('session.reminder', client.phone, text)]);
});

bus.on('session.followup', async ({ sessionId }) => {
  const { client, therapist } = await load(sessionId);
  const text = `Hi ${client.name}, thank you for your session with ${therapist.name}. You can book the next one from your portal.`;
  await Promise.all([sendEmail('session.followup', client.email, 'Thank you', text), sendWhatsApp('session.followup', client.phone, text)]);
});

bus.on('payment.paid', async ({ client, therapist, payment }) => {
  const text = `Payment of Rs ${payment.total} received (invoice ${payment.invoiceNumber}). Thank you.`;
  await sendEmail('payment.paid', client.email, 'Payment received', text);
  await sendEmail('payment.paid', therapist.email, 'Payment received', `${client.name} paid Rs ${payment.total}.`);
});

// Every handler failure is logged, never crashes the request that emitted the event
const emit = bus.emit.bind(bus);
bus.emit = (event, payload) => {
  for (const l of bus.listeners(event)) Promise.resolve(l(payload)).catch((e) => console.error(`[notify:${event}]`, e.message));
  return true;
};
exports.emit = emit;

// Simple scheduler: 24h reminders and post-session follow-ups
exports.startScheduler = (everyMs = 60000) => {
  const tick = async () => {
    try {
      const now = Date.now();
      const due = await Session.find({
        status: 'confirmed',
        reminderSentAt: { $exists: false },
        start: { $gt: new Date(now), $lte: new Date(now + 24 * 3600 * 1000) },
      });
      for (const s of due) {
        await Session.updateOne({ _id: s._id }, { reminderSentAt: new Date() });
        bus.emit('session.reminder', { sessionId: s._id });
      }
      const done = await Session.find({ status: 'completed', followupSentAt: { $exists: false } });
      for (const s of done) {
        await Session.updateOne({ _id: s._id }, { followupSentAt: new Date() });
        bus.emit('session.followup', { sessionId: s._id });
      }
    } catch (e) {
      console.error('[scheduler]', e.message);
    }
  };
  const h = setInterval(tick, everyMs);
  h.unref?.();
  return tick;
};
