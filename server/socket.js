const http = require('http');
const socketio = require('socket.io');

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

  removeUser(userId) {
    this.users = this.users.filter(user => user.userId !== userId);
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
        
        socket.emit('roomJoined', roomJoinResponse(room, user, socket.id, true));    
        socket.to(roomId).emit('addPeer', user);
      } else {
        socket.join(roomId);

        const room = new Room(roomId);
        user.socketId = socket.id;
        room.addUser(user);
        rooms[roomId] = room;

        socket.emit('roomJoined', roomJoinResponse(room, user, socket.id));
      }
    });

    socket.on('sessionDescription', (description, socketId) => {
      io.to(socketId).emit('peerSessionDescription', { caller: socket.id, description });
    });

    socket.on('iceCandidate', iceCandidate => {
      io.to(iceCandidate.socketId).emit('addICECandidate', { socketId: socket.id, iceCandidate });
    });

    socket.on('disconnect', () => {});

    socket.on('speechToTextData', data => {});
  });


  server.listen(SOCKET_PORT, () => {
    console.log(`socket live on 'http://localhost:${SOCKET_PORT}'`)
  });
}

module.exports = initSocket;
