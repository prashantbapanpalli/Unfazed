const { fromZonedTime, formatInTimeZone } = require('date-fns-tz');
const Session = require('../models/Session');
const Availability = require('../models/Availability');

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const pad = (n) => String(n).padStart(2, '0');
const localToUtc = (date, minutes, tz) => fromZonedTime(`${date}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00`, tz);

const MIN_NOTICE_MS = 60 * 60 * 1000; // clients cannot book less than 1 hour ahead
const HOLD_MS = 15 * 60 * 1000; // pending (unpaid) bookings hold a slot for 15 minutes
exports.HOLD_MS = HOLD_MS;

// Free slots of expired, unpaid bookings
exports.expirePending = () =>
  Session.updateMany({ status: 'pending_payment', expiresAt: { $lt: new Date() } }, { status: 'expired', $unset: { slotKey: 1, expiresAt: 1 } });

exports.slotKey = (therapistId, start) => `${therapistId}_${new Date(start).toISOString()}`;

/**
 * Open slots for one calendar date (YYYY-MM-DD in the THERAPIST's timezone).
 * Returns ISO (UTC) strings; the frontend shows them in the client's local timezone.
 */
exports.openSlots = async (therapist, date, duration) => {
  await exports.expirePending();
  const av = await Availability.findOne({ therapistId: therapist._id });
  if (!av || !av.durations.includes(duration)) return [];
  const tz = therapist.timezone;

  const override = av.overrides.find((o) => o.date === date);
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const windows = override ? override.slots : av.weekly.filter((w) => w.day === weekday);

  const buffer = av.bufferMinutes;
  const dayStart = localToUtc(date, 0, tz);
  const dayEnd = new Date(dayStart.getTime() + 36 * 3600 * 1000);
  const taken = await Session.find({
    therapistId: therapist._id,
    status: { $in: ['confirmed', 'pending_payment'] },
    start: { $gte: dayStart, $lt: dayEnd },
  });

  const out = [];
  const earliest = Date.now() + MIN_NOTICE_MS;
  for (const w of windows) {
    for (let m = toMin(w.start); m + duration <= toMin(w.end); m += duration + buffer) {
      const start = localToUtc(date, m, tz);
      const end = new Date(start.getTime() + duration * 60000);
      if (start.getTime() < earliest) continue;
      if (formatInTimeZone(start, tz, 'yyyy-MM-dd') !== date) continue;
      const blocked = av.blocked.some((b) => start < b.end && end > b.start);
      const clash = taken.some(
        (s) => start.getTime() < s.end.getTime() + buffer * 60000 && end.getTime() + buffer * 60000 > s.start.getTime()
      );
      if (!blocked && !clash) out.push(start.toISOString());
    }
  }
  return out;
};
