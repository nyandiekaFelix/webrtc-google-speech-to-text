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


  io.on('connection', socket => {
    socket.on('joinRoom', (roomId, user, next) => {
      if (io.sockets.adapter.rooms[roomId]) {
        const room = rooms[roomId];

        if(room.getUser(socket.id)) {
          return next(
            { room: roomId, users: room.roomUsers }, 
            { ...user, socketId: socket.id }
          );
        } else {
          socket.join(roomId);
          rooms[roomId].addUser(user);
          next(
            { room: roomId, users: room.roomUsers },
            { ...user, socketId: socket.id }
          );
        }
        
      } else {
        socket.join(roomId);

        const room = new Room(roomId);
        user.socketId = socket.id;
        room.addUser(user);
        rooms[roomId] = room;

        next(
          { room: room.roomId, users: room.roomUsers },
          { ...user, socketId: socket.id}
        );              
      }
    });
  });

  server.listen(SOCKET_PORT, () => {
    console.log(`socket live on 'http://localhost:${SOCKET_PORT}'`)
  });
}

module.exports = initSocket;
