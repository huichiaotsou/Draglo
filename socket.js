/* eslint-disable no-shadow */
const { Server } = require('socket.io');

const socket = {};
require('dotenv').config();

socket.init = (server) => {
  const io = new Server(server);
  console.log('socket init with success');

  io.on('connect', (socket) => {
    console.log('io.on connected');

    const { token } = socket.handshake.auth;
    if (token === undefined) {
      return;
    }
    const url = socket.request.headers.referer;
    console.log('user connected at', url);
    const tripId = url.split('=')[1];

    socket.on('joinTrip', () => {
      socket.join(tripId);
      socket.emit('join-trip-message', `You've join No. ${tripId} Trip`);
      io.sockets.to(tripId).emit('room-brocast', 'user has join this room');
    });

    socket.on('refreshSpots', () => {
      console.log(`${tripId} refreshSpots --> tripId received on backend`);
      io.to(tripId).emit('refreshSpots', tripId);
    });

    socket.on('updateArrangement', (eventInfo) => {
      console.log('updateArrangement --> eventInfo received on backend');
      io.to(tripId).emit('updateArrangement', eventInfo);
    });

    socket.on('removeArrangement', (eventId) => {
      console.log(`removeArrangement --> ${eventId} eventId received on backend`);
      io.to(tripId).emit('removeArrangement', eventId);
    });

    socket.on('renderCalendar', () => {
      console.log('renderCalendar --> tripId received on backend');
      io.to(tripId).emit('renderCalendar', tripId);
    });
  });
};

module.exports = {
  socket,
};
