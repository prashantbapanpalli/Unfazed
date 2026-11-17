const { Server } = require('socket.io');
const { verify } = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const Client = require('../models/Client');
const { canAccess } = require('../services/entitlementService');

const room = (therapistId, clientId) => `chat:${therapistId}:${clientId}`;

module.exports = (httpServer) => {
  const io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL || '*' } });

  // Socket auth: same JWT as the REST API
  io.use((socket, next) => {
    try {
      socket.user = verify(socket.handshake.auth?.token);
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const u = socket.user;
    // A client is always in the room with their own therapist; a therapist joins rooms per client.
    if (u.role === 'client') socket.join(room(u.therapistId, u.id));

    socket.on('chat:join', async ({ clientId }, ack) => {
      if (u.role !== 'therapist') return ack?.({ error: 'forbidden' });
      if (!(await Client.exists({ _id: clientId, therapistId: u.id }))) return ack?.({ error: 'not_found' });
      socket.join(room(u.id, clientId));
      ack?.({ ok: true });
    });

    socket.on('chat:send', async ({ clientId, text, attachment }, ack) => {
      try {
        const therapistId = u.role === 'therapist' ? u.id : u.therapistId;
        const cId = u.role === 'therapist' ? clientId : u.id;
        if (!(await canAccess(therapistId, 'chat')).allowed) return ack?.({ error: 'upgrade_required' });
        if (!text && !attachment) return ack?.({ error: 'empty' });
        if (u.role === 'therapist' && !(await Client.exists({ _id: cId, therapistId }))) return ack?.({ error: 'not_found' });
        const msg = await Message.create({ therapistId, clientId: cId, sender: u.role, text, attachment });
        io.to(room(therapistId, cId)).emit('chat:message', msg);
        ack?.({ ok: true, message: msg });
      } catch (e) {
        ack?.({ error: 'failed' });
      }
    });

    // Stretch goals: typing indicator + read receipts
    socket.on('chat:typing', ({ clientId, typing }) => {
      const therapistId = u.role === 'therapist' ? u.id : u.therapistId;
      const cId = u.role === 'therapist' ? clientId : u.id;
      socket.to(room(therapistId, cId)).emit('chat:typing', { from: u.role, typing: !!typing });
    });

    socket.on('chat:read', async ({ clientId }) => {
      const therapistId = u.role === 'therapist' ? u.id : u.therapistId;
      const cId = u.role === 'therapist' ? clientId : u.id;
      const other = u.role === 'therapist' ? 'client' : 'therapist';
      await Message.updateMany({ therapistId, clientId: cId, sender: other, readAt: { $exists: false } }, { readAt: new Date() });
      socket.to(room(therapistId, cId)).emit('chat:read', { by: u.role });
    });
  });
  return io;
};
