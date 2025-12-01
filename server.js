// server.js
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ---------- STATIC FILES ----------

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Optional: explicit routes, if you like
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));   // main poster
});

app.get('/mobile', (req, res) => {
  res.sendFile(path.join(publicPath, 'mobile.html'));  // phone interface
});

// ---------- SOCKET.IO LOGIC ----------

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('giftWarmth', (payload) => {
    console.log('Received giftWarmth from', payload.name, payload.email);
    // broadcast to everyone (poster + other clients)
    io.emit('giftWarmth', payload);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ---------- START SERVER ----------

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
