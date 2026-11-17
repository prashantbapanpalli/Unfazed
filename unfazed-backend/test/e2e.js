// End-to-end API test. Needs the API running (npm run dev) and the DB reachable; runs in payment MOCK mode.
// Usage: npm run seed && npm start   (in one terminal)  then  npm test
require('dotenv').config();
const crypto = require('crypto');
const { io } = require('socket.io-client');

const BASE = process.env.TEST_API || 'http://localhost:5000';
let passed = 0, failed = 0;
const ok = (cond, msg) => { cond ? passed++ : failed++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); };

async function api(path, { method = 'GET', token, body, raw } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }), ...(raw?.headers || {}) },
    body: raw ? raw.body : body && JSON.stringify(body),
  });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json() : null;
  return { status: res.status, data, ct };
}

const dateStr = (offsetDays) => {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d); // YYYY-MM-DD in IST
};

(async () => {
  const stamp = Date.now();
  // ---------- Module 1: auth + profile + slug
  const reg = await api('/auth/register', { method: 'POST', body: { email: `t${stamp}@ex.com`, password: 'secret12', name: `Dr. Test ${stamp}` } });
  const slug = `dr-test-${stamp}`;
  ok(reg.status === 201 && reg.data.therapist.slug === slug, 'Module 1: register creates therapist + unique slug');
  const reg2 = await api('/auth/register', { method: 'POST', body: { email: `u${stamp}@ex.com`, password: 'secret12', name: `Dr. Test ${stamp}` } });
  ok(reg2.data.therapist.slug === `${slug}-2`, 'Module 1: duplicate name gets unique slug (-2)');
  const dup = await api('/auth/register', { method: 'POST', body: { email: `t${stamp}@ex.com`, password: 'secret12', name: 'X' } });
  ok(dup.status === 409, 'Module 1: duplicate email rejected');
  const login = await api('/auth/login', { method: 'POST', body: { email: `t${stamp}@ex.com`, password: 'secret12' } });
  const T = login.data.token;
  ok(!!T && !login.data.therapist.password_hash, 'Module 1: login works and hash never returned');
  ok((await api('/clients')).status === 401, 'Module 1: protected route needs JWT');

  await api('/therapist/profile', { method: 'PUT', token: T, body: { sessionRate: 1000, advancePercent: 100, bio: 'Hello', specializations: ['Anxiety'] } });
  const pub = await api(`/${'public/' + slug}`);
  ok(pub.status === 200 && pub.data.therapist.name === `Dr. Test ${stamp}` && !pub.data.therapist.email, 'Module 1: public branded page renders without private fields');

  // ---------- Module 2: scheduling
  const weekly = [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, start: '09:00', end: '12:00' }));
  await api('/scheduling/availability', { method: 'PUT', token: T, body: { weekly, bufferMinutes: 10, durations: [60] } });
  const day = dateStr(3);
  const slots = await api(`/public/${slug}/slots?date=${day}&duration=60`);
  ok(slots.data.slots.length === 2, `Module 2: slots generated for ${day} (09-12 with 10 min buffer => 2) got ${slots.data.slots.length}`);
  ok(slots.data.slots[0] === new Date(`${day}T09:00:00+05:30`).toISOString(), 'Module 2: slot times are correct UTC for IST');

  const intake = (n) => api(`/public/${slug}/clients`, { method: 'POST', body: { name: `Client ${n}`, email: `c${n}${stamp}@ex.com`, phone: '9999999999', consent: true, intake: { age: 30, presentingConcern: 'Stress' } } });
  const noConsent = await api(`/public/${slug}/clients`, { method: 'POST', body: { name: 'N', email: `n${stamp}@ex.com`, consent: false } });
  ok(noConsent.status === 400, 'Module 3: intake without consent rejected');
  const c1 = await intake(1), c2 = await intake(2);
  ok(c1.status === 201 && c1.data.client.consent.given && c1.data.client.consent.at, 'Module 3: intake + consent stored with timestamp');

  const slot = slots.data.slots[0];
  const b1 = await api(`/public/${slug}/book`, { method: 'POST', token: c1.data.token, body: { start: slot, duration: 60 } });
  ok(b1.status === 201 && b1.data.session.status === 'pending_payment' && b1.data.payment.total === 1000, 'Module 4: booking creates pending session + payment order (Rs 1000)');
  const b2 = await api(`/public/${slug}/book`, { method: 'POST', token: c2.data.token, body: { start: slot, duration: 60 } });
  ok(b2.status === 409, 'Module 2: second client cannot take the same slot (double booking prevented)');
  const slotsAfter = await api(`/public/${slug}/slots?date=${day}&duration=60`);
  ok(!slotsAfter.data.slots.includes(slot), 'Module 2: booked slot disappears for other clients');

  // concurrent race on the second slot
  const slot2 = slots.data.slots[1];
  const race = await Promise.all([c1, c2].map((c) => api(`/public/${slug}/book`, { method: 'POST', token: c.data.token, body: { start: slot2, duration: 60 } })));
  ok(race.filter((r) => r.status === 201).length === 1, 'Module 2: simultaneous bookings -> exactly one wins');

  // ---------- Module 4: payments
  const pay1 = await api('/payments/mock-pay', { method: 'POST', token: c1.data.token, body: { orderId: b1.data.order.id } });
  ok(pay1.data.status === 'paid' && pay1.data.invoiceNumber, 'Module 4: payment confirmed + invoice number');
  const again = await api('/payments/mock-pay', { method: 'POST', token: c1.data.token, body: { orderId: b1.data.order.id } });
  ok(again.data.invoiceNumber === pay1.data.invoiceNumber, 'Module 4: confirmation is idempotent');
  const sessions = await api('/portal/sessions', { token: c1.data.token });
  ok(sessions.data.find((s) => s._id === b1.data.session._id)?.status === 'confirmed', 'Module 4: session confirmed after payment');
  const inv = await api(`/payments/${pay1.data._id}/invoice`, { token: c1.data.token });
  ok(inv.status === 200 && inv.ct.includes('pdf'), 'Module 4: invoice PDF generated');
  const invOther = await api(`/payments/${pay1.data._id}/invoice`, { token: c2.data.token });
  ok(invOther.status === 404, 'Module 4: another client cannot download this invoice');

  // webhook: loser of the race pays via webhook only
  const winner = race.find((r) => r.status === 201);
  const webhookBody = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_wh_1', order_id: winner.data.order.id } } } });
  const badSig = await api('/payments/webhook', { method: 'POST', raw: { body: webhookBody, headers: { 'x-razorpay-signature': 'bad' } } });
  ok(badSig.status === 400, 'Module 4: webhook with bad signature rejected');
  const goodSig = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(webhookBody).digest('hex');
  const wh = await api('/payments/webhook', { method: 'POST', raw: { body: webhookBody, headers: { 'x-razorpay-signature': goodSig } } });
  ok(wh.status === 200, 'Module 4: signed webhook accepted');
  const winnerToken = [c1, c2][race.indexOf(winner)].data.token;
  const ws = await api('/portal/sessions', { token: winnerToken });
  ok(ws.data.find((s) => s._id === winner.data.session._id)?.status === 'confirmed', 'Module 4: webhook confirms the booking (not just the client callback)');

  // packages
  const pk = await api('/scheduling/packages', { method: 'POST', token: T, body: { name: 'Starter', sessions: 3, ratePerSession: 900, validityDays: 60 } });
  const buy = await api(`/public/${slug}/packages/${pk.data._id}/buy`, { method: 'POST', token: c2.data.token });
  ok(buy.data.payment.total === 2700, 'Module 4: package priced 3 x 900 = 2700');
  await api('/payments/mock-pay', { method: 'POST', token: c2.data.token, body: { orderId: buy.data.order.id } });
  const myPk = await api('/portal/packages', { token: c2.data.token });
  ok(myPk.data[0]?.sessionsTotal === 3 && myPk.data[0].sessionsUsed === 0, 'Module 4: package credits created after payment');
  const day2 = dateStr(4);
  const s3 = (await api(`/public/${slug}/slots?date=${day2}&duration=60`)).data.slots[0];
  const viaPk = await api(`/public/${slug}/book`, { method: 'POST', token: c2.data.token, body: { start: s3, duration: 60 } });
  ok(viaPk.status === 201 && viaPk.data.paidWithPackage && viaPk.data.session.status === 'confirmed', 'Module 4: booking uses package credit, no payment');
  const myPk2 = await api('/portal/packages', { token: c2.data.token });
  ok(myPk2.data[0].sessionsUsed === 1, 'Module 4: package usage tracked');

  // ---------- Module 7: entitlements (free tier cap = 3 active clients)
  await intake(3);
  const full = await intake(4);
  ok(full.status === 403 && full.data.code === 'NOT_ACCEPTING', 'Module 7: public intake blocked when therapist hits plan cap');
  const addBlocked = await api('/clients', { method: 'POST', token: T, body: { name: 'Manual', email: `m${stamp}@ex.com` } });
  ok(addBlocked.status === 403 && addBlocked.data.code === 'UPGRADE_REQUIRED', 'Module 7: add-client gated through the Entitlement service');
  const soapBlocked = await api('/notes', { method: 'POST', token: T, body: { clientId: c1.data.client._id, type: 'private', template: 'soap', content: 'x' } });
  ok(soapBlocked.status === 403 && soapBlocked.data.featureKey === 'note_templates', 'Module 7: SOAP template gated on free plan');
  const aBasic = await api('/analytics', { token: T });
  ok(aBasic.data.depth === 'basic' && aBasic.data.noShowRate === undefined, 'Module 7: free plan gets basic analytics only');
  const feat = await api('/therapist/features', { token: T });
  ok(feat.data.access.active_client_cap.limit === 3 && feat.data.access.active_client_cap.current === 3, 'Module 7: frontend feature map shows usage vs cap');

  await api('/therapist/subscription', { method: 'PUT', token: T, body: { tier: 'premium' } });
  const addOk = await api('/clients', { method: 'POST', token: T, body: { name: 'Manual', email: `m${stamp}@ex.com` } });
  ok(addOk.status === 201, 'Module 7: upgrade lifts the client cap');

  // ---------- Module 5: private vs shared notes
  const cid = c1.data.client._id;
  const pn = await api('/notes', { method: 'POST', token: T, body: { clientId: cid, type: 'private', template: 'soap', content: '<p>PRIVATE-CLINICAL-SECRET</p>' } });
  await api('/notes', { method: 'POST', token: T, body: { clientId: cid, type: 'shared', template: 'free', content: '<p>Shared homework</p>' } });
  ok(pn.status === 201, 'Module 5: SOAP note allowed after upgrade');
  const portalNotes = await api('/portal/notes', { token: c1.data.token });
  const leaked = JSON.stringify(portalNotes.data).includes('PRIVATE-CLINICAL-SECRET');
  ok(portalNotes.data.length === 1 && !leaked, 'Module 5: client portal returns ONLY shared notes (private never leaks)');
  const profile = await api(`/clients/${cid}`, { token: T });
  ok(profile.data.notes.length === 2 && profile.data.sessions.length >= 1 && profile.data.payments.length >= 1, 'Module 3: client profile aggregates sessions + payments + notes');
  const list = await api('/clients?sort=name&order=asc&q=client', { token: T });
  ok(list.data.length >= 3 && list.data[0].name <= list.data[1].name, 'Module 3: client list searchable and sortable');

  // ---------- Module 6: chat + notifications
  const connect = (token) => new Promise((resolve) => { const s = io(BASE, { auth: { token } }); s.on('connect', () => resolve(s)); });
  const [therapistSock, clientSock] = await Promise.all([connect(T), connect(c1.data.token)]);
  const joined = await new Promise((r) => therapistSock.emit('chat:join', { clientId: cid }, r));
  ok(joined.ok, 'Module 6: therapist joins client chat room');
  const got = new Promise((r) => therapistSock.on('chat:message', r));
  await new Promise((r) => clientSock.emit('chat:send', { text: 'Hello doctor' }, r));
  ok((await got).text === 'Hello doctor', 'Module 6: real-time message delivered');
  const hist = await api(`/chat/${cid}`, { token: T });
  ok(hist.data.length === 1, 'Module 6: chat history stored');
  const rogue = io(BASE, { auth: { token: 'nope' } });
  const err = await new Promise((r) => rogue.on('connect_error', r));
  ok(/unauthorized/.test(err.message), 'Module 6: socket rejects bad token');
  [therapistSock, clientSock, rogue].forEach((s) => s.close());

  // ---------- Module 7: analytics on seeded demo account (premium)
  const demo = await api('/auth/login', { method: 'POST', body: { email: 'sharma@example.com', password: 'password123' } });
  const an = await api('/analytics', { token: demo.data.token });
  ok(an.data.depth === 'full' && an.data.revenueTrend.length >= 1 && an.data.noShowRate > 0 && an.data.activeClients > 0, 'Module 7: full analytics via aggregation pipelines (revenue, active clients, no-show rate)');

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
