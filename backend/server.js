const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});
app.set('io', io);

const apiRoutes = require('./routes/api');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api', apiRoutes);

// MongoDB Connection
// We will use an environment variable for the URI
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/travhub';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Reverse Proxy for Frontend (Expo Web)
app.use(createProxyMiddleware({ 
  target: 'http://localhost:8081', 
  changeOrigin: true,
  ws: true // Enable WebSocket proxying for Hot Reloading
}));

// Socket.io for Real-time Chat
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
