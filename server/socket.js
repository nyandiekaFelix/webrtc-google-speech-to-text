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

  const socketResponse = (room, userData, socketId) => ({
    room: room.roomId, 
    users: room.roomUsers,
    currentUser: { ...userdata, socketId }
  });

  io.on('connection', socket => {
    socket.on('joinRoom', (roomId, user) => {
      if (io.sockets.adapter.rooms[roomId]) {
        const room = rooms[roomId];

        if(room.getUser(socket.id)) {
          socket.emit('roomJoined', socketResponse(room, user, socket.id));    
          // 'newMember' broadcast to other members
        } else {
          socket.join(roomId);
          user.socketId = socket.id;
          rooms[roomId].addUser(user);
          
          socket.emit('roomJoined', socketResponse(room, user, socket.id));    
          // 'newMember' broadcast to other members
        }
        
      } else {
        socket.join(roomId);

        const room = new Room(roomId);
        user.socketId = socket.id;
        room.addUser(user);
        rooms[roomId] = room; 

        socket.emit('roomJoined', socketResponse(room, user, socket.id));
      }
    });

    socket.on('disconnect', (roomId, user) => {
      
    });

    socket.on('deleteRoom', roomId => {
      
    });
  });


  server.listen(SOCKET_PORT, () => {
    console.log(`socket live on 'http://localhost:${SOCKET_PORT}'`)
  });
}

module.exports = initSocket;
