<template>
  <b-container class="meeting-room">
    <b-container v-if="room" fluid>
      <h4>Meeting Id{{ room.roomId }}</h4>
      <b-container class="meeting-link" fluid>Sharable Link</b-container>
      <b-container fluid>
      <b-row>
        <b-col cols="6"
          id="local-video" 
          class="video-item">
          <p class="video-header">{{ currentUser.username || '---' }}</p> 
          <video ref="my-video"></video> 
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
  import WebrtcMixin from '../../mixins/webrtcMixin.js';
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
      onRoomJoined(room, currentUser) {
        this.room = room;
        this.currentUser = currentUser;
        
        this.startCall();
      },

      async startCall() {
        await this.getUserMedia();
        this.peerConnection = new RTCPeerConnection(this.configuration)
        this.addLocalStream()
        
        console.log('stream', this.stream)
        console.log('p-conn', this.peerConnection)
      },

      joinRoom(user) {
        this.$socket.emit('joinRoom', this.roomId, user, this.onRoomJoined)
      },

      exitRoom() {

      },

      toggleAudio() {
        this.currentUser.muted = !this.currentUser.muted;
      },
      disableVideo() {},
    },
    mounted() {
      this.roomId = this.$route.params.roomId;
      
      const user = { 
        username: this.user ? this.user.username : null,
        muted: false,
        paused: false
      };
      this.joinRoom(user);
    },
  };
</script>

<style scoped>
  .video-item {
    background: #000;
    height: 400px;
  }
  .video-header {
    margin-bottom: -25px !important;
   /* background: #000;*/
    color: #fff;
    padding-left: 4px;
    width: 100%;
    z-index: 1000;
    position: relative;
  }
  video {
    background: #000;
    width: 100%;
  }
</style>
