const http = require('http');
const socketio = require('socket.io');
const SocketStream = require('socket.io-stream');

const { speechStreamToText } = require('./speechToText.js');

const SOCKET_PORT = process.env.port || 8989;

/* Ideally this functionality should be done with an in-memory 
   database like Redis for better performance
*/
const rooms = {};

class Room {
  constructor(roomId) {
    this.roomIdentifier = roomId;
    this.users = [];
  }
  
  get roomId() {
    return this.roomIdentifier;
  }

  get roomUsers() {
    return this.users
  }

  addUser(user) {
    this.users.push(user);
  }

  getUser(socketId) {
    const [user] = this.users.filter(user => user.socketId === socketId);
    return user;
  }

  removeUser(socketId) {
    this.users = this.users.filter(user => user.socketId !== socketId);
  }
}


function initSocket(app) {
  const server = http.createServer(app);
  const io = socketio(server, { origins: '*:*' });

  const roomJoinResponse = (room, userData, socketId, shouldCreateOffer = false) => ({
    room: room.roomId, 
    users: room.roomUsers,
    currentUser: { ...userData, socketId }
  });

  io.on('connection', socket => {
    socket.on('joinRoom', (roomId, user) => {
      if (io.sockets.adapter.rooms[roomId]) {
        const room = rooms[roomId];

        if(room.roomUsers.length === 4) {
          socket.emit('meetingFull');
          return;
        }

        socket.join(roomId);
        user.socketId = socket.id;
        room.addUser(user);
        
        socket.emit('roomJoined', roomJoinResponse(room, user, socket.id));    
        socket.to(roomId).emit('addPeer', { peer: user, shouldCreateOffer: true });
      } else {
        socket.join(roomId);

        const room = new Room(roomId);
        user.socketId = socket.id;
        room.addUser(user);
        rooms[roomId] = room;

        socket.emit('roomJoined', roomJoinResponse(room, user, socket.id));
      }
    });

    socket.on('offer', (description, recipientSocket) => {
      io.to(recipientSocket).emit('peerOffer', { caller: socket.id, description });
    });

    socket.on('answer', (description, callerSocket) => {
      io.to(callerSocket).emit('peerAnswer', { recipient: socket.id, description });
    });

    socket.on('iceCandidate', ({ socketId, iceCandidate }) => {
      io.to(socketId).emit('addICECandidate', { socketId: socket.id, iceCandidate });
    });
    
    socket.on('exitRoom', (roomId, socketId) => {
      const room = rooms[roomId];
      if(room) {
        room.removeUser(socketId);
        socket.to(roomId).emit('removePeer', socketId);
      }
    });

    SocketStream(socket).on('speechStream', (stream, roomId) => {
      speechStreamToText(stream, data => {
        socket.to(roomId).emit('transcriptionData', data)
      });
    });
  });


  server.listen(SOCKET_PORT, () => {
    console.log(`socket live on 'http://localhost:${SOCKET_PORT}'`)
  });
}

module.exports = initSocket;
