<template>
  <b-container class="meeting-room">
    <b-container v-if="room" fluid>
      <b-container class="meeting-link" fluid>Sharable Link</b-container>
      <b-container fluid>
      <b-row>
        <b-col cols="6"
          id="local-video" 
          class="video-item">
          <p class="video-header">{{ currentUser.username || '---' }}</p> 
          <video ref="localVideo" autoplay playsinline controls="false"></video> 
        </b-col>
        <b-col 
          cols="6"
          class="video-item"
          v-for="user in room.users.filter(usr => usr.socketId !== currentUser.socketId)"
          :key="user.socketId">
          <p class="video-header">{{ user.username || '---' }}</p> 
          <video autoplay class="remote-video" ref="`video-${user.socketId}`"></video>      
        </b-col>
      </b-row>
      </b-container>
    </b-container>
    <b-container fluid class="captions">Captions</b-container>
    <b-container fluid class="media-buttons">Local Video Controls</b-container>
  </b-container>
</template>

<script>
  import WebrtcMixin from '../../mixins/WebrtcMixin.js';
  import AuthMixin from '../../mixins/AuthMixin.vue';

  export default {
    name: 'chat-room',
    mixins: [AuthMixin, WebrtcMixin],
    
    data() {
      return {
        roomId: null,
        room: null,
        currentUser: null,
      };
    },

    methods: {
      subscribeListeners() {
        this.sockets.listener.subscribe('roomJoined', this.onRoomJoined);
        //this.sockets.listener.subscribe('removeRemotePeer', this.removeRemotePeer);
      },

      onRoomJoined(data) {
        console.log('gets here', room);
        const [room, currentUser] = data;
        this.room = room;
        this.currentUser = currentUser;

      },

      joinRoom(user) {
        this.$socket.emit('joinRoom', this.roomId, user)
      },

      exitRoom(message) {
        console.log('ext test', message)
      },
    },
    mounted() {
      this.subscribeListeners();
      this.roomId = this.$route.params.roomId;
      
      const user = { 
        username: this.user ? this.user.username : null,
      };
      this.joinRoom(user);
    },
  };
</script>

<style scoped>
  .video-item {
    background: #000;
    border: solid 1px #fff;
    height: 300px;
  }
  .video-header {
    margin-bottom: -25px !important;
   /* background: #000;*/
    color: #fff;
    padding-left: 4px;
    width: 10%;
    z-index: 1000;
    position: relative;
  }
  video {
    background: #000;
    width: 100%;
  }
</style>
