// SETUP
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// SOCKET.IO LOGIC 
io.on('connection', (socket) => {
  console.log("Client connected:", socket.id);

  socket.on('startGift', (payload) => {
    console.log("Server: received startGift", payload);
    io.emit('startGift', payload);  // 🔴 THIS IS CRUCIAL
  });

  socket.on('giftWarmth', (payload) => {
    console.log("Server: received giftWarmth", payload);
    io.emit('giftWarmth', payload);
  });
});

// START SERVER 
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
