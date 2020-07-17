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

  getUser(userId) {
    const [user] = this.users.filter(user => user.userId === userId);
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
        socket.join(roomId)
        rooms[roomId].addUser(user);
        
        next({ room: room.roomId, users: room.roomUsers });
      } else {
        socket.join(roomId);

        const room = new Room(roomId);
        room.addUser(user);
        rooms[roomId] = room;

        next({ room: room.roomId, users: room.roomUsers });              
      }
    });
  });

  server.listen(SOCKET_PORT, () => {
    console.log(`socket live on 'http://localhost:${SOCKET_PORT}'`)
  });
}

module.exports = initSocket;
