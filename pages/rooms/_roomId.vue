<template>
  <b-container class="meeting-room">
    <b-container fluid v-if="meetingFull">
      <b-jumbotron header="Meeting Full">
        <p>Sorry. This meeting can only have a maximum of 4 participants</p>
      </b-jumbotron>
    </b-container>
    <b-container v-show="room" fluid>
      <b-container class="meeting-link" fluid>
        Sharable Meeting Link: <em>{{ sharableLink }}</em>
      </b-container>
      <b-container fluid>
        <b-row>
          <b-col cols="6"
            id="local-video" 
            class="video-item">
            <p class="video-header" v-if="currentUser">{{ currentUser.username || '---' }}</p> 
            <video ref="localVideo" 
              autoplay playsinline></video> 
          </b-col>
          <b-col 
            cols="6"
            class="video-item"
            v-for="peer in Object.keys(peers)"
            :key="peers[peer].socketId">
            <p class="video-header">{{ peers[peer].username || '---' }}</p> 
            <video autoplay
              class="remote-video" 
              ref="`video-${peer}`"
              :src-object.camel="peers[peer].stream"></video>      
          </b-col>
        </b-row>
      </b-container>
      <b-container fluid class="captions">{{ captions }}</b-container>
      <b-container fluid class="media-buttons" v-if="localStream">
        <b-button variant="primary" @click="toggleMic">{{ micOn ? 'Mute Mic' : 'Unmute Mic'}}</b-button>
        <b-button variant="primary" @click="toggleVideo">{{ videoOn ? 'Disable Camera' : 'Enable Camera' }}</b-button>
        <b-button variant="danger" @click="exitRoom">Leave Meeting</b-button>
      </b-container>
    </b-container>
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
        room: {},
        currentUser: null,
        meetingFull: false,
        sharableLink: null
      };
    },

    methods: {
      subscribeListeners() {
        this.sockets.listener.subscribe('roomJoined', this.onRoomJoined);
        this.sockets.listener.subscribe('meetingFull', this.onMeetingFull);
      },

      onRoomJoined(data) {
        const { room, users, currentUser } = data;
        this.room = room;
        this.currentUser = currentUser;

        if(users.length > 1) {
          const otherMembers = users.filter(({ socketId }) => socketId !== currentUser.socketId);
          otherMembers.forEach(peer => { this.addPeer({ peer }); });
        }
      },

      onMeetingFull() {
        this.onMeetingFull = true;
      },

      joinRoom(user) {
        this.$socket.emit('joinRoom', this.roomId, user)
      },

      exitRoom() {
        this.peers = {};
        this.$socket.emit('exitRoom', this.roomId, this.currentUser.socketId);
        this.$router.push({ name: 'rooms' });
      },
    },
    mounted() {
      this.subscribeListeners();
      this.roomId = this.$route.params.roomId;
      this.sharableLink = `${window.location.origin}${this.$route.fullPath}`;
 
      const user = { 
        username: this.user ? this.user.username : null,
      };
        
      this.getUserMedia().then(() => { this.joinRoom(user); })
    },
  };
</script>

<style scoped>
  .meeting-link {
    margin: 10px 0;
  }

  .video-item {
    border: solid 1px #fff;
    height: 300px;
  }
  .video-header {
    margin-bottom: -25px !important;
    background: rgba(0, 0, 0, 0.2);
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
