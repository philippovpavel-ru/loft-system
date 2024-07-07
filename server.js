const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

require('./models/connection');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );
  next();
});

app.use(express.static(path.join(__dirname, 'build')));
app.use(express.static(path.join(__dirname, 'uploads')));

require('./auth/passport');

app.use('/api', require('./routes'));

app.use('*', (_req, res) => {
  const file = path.resolve(__dirname, 'build', 'index.html');
  res.sendFile(file);
});

app.use((err, _, res, __) => {
  console.error(err.stack);
  res.status(500).json({
    code: 500,
    message: err.message,
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('Environment', process.env.NODE_ENV);
  console.log(`Server running. Use our API on port: ${PORT}`);
});

const connectedUsers = {};
const messageHistory = {};

io.on('connection', (socket) => {
  const socketId = socket.id;

  socket.on('users:connect', (data) => {
    const user = { ...data, socketId, activeRoom: null };
    connectedUsers[socketId] = user;

    console.log(Object.values(connectedUsers));

    socket.emit('users:list', Object.values(connectedUsers)); // Отправка всех пользователей текущему пользователю
    socket.broadcast.emit('users:add', user); // Отправка нового пользователя всем остальным пользователям
  });

  socket.on('message:add', (data) => {
    const { senderId, recipientId } = data;

    socket.emit('message:add', data);
    socket.broadcast.to(data.roomId).emit('message:add', data);
    addHistory(senderId, recipientId, data);
    addHistory(recipientId, senderId, data);
  });

  socket.on('message:history', (data) => {
    const history = messageHistory[data.userId]?.[data.recipientId] || [];
    socket.emit('message:history', history);
  });

  socket.on('disconnect', () => {
    delete connectedUsers[socketId];
    socket.broadcast.emit('users:leave', socketId);
  });
});

function addHistory(senderId, recipientId, data) {
  if (!messageHistory[senderId]) {
    messageHistory[senderId] = {};
  }
  if (!messageHistory[senderId][recipientId]) {
    messageHistory[senderId][recipientId] = [];
  }
  messageHistory[senderId][recipientId].push(data);
}

module.exports = { app, server };
