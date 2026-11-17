require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const initChat = require('./src/sockets/chatSocket');
const { startScheduler } = require('./src/services/notificationService');
const { mock } = require('./src/config/razorpay');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    const server = http.createServer(app);
    initChat(server);
    startScheduler();
    server.listen(PORT, () => console.log(`API on http://localhost:${PORT}  (payments: ${mock ? 'MOCK mode' : 'Razorpay'})`));
  })
  .catch((e) => {
    console.error('Failed to start:', e.message);
    process.exit(1);
  });
