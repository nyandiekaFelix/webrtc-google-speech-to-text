<template>
  <b-container class="meeting-room">
    <b-container v-if="room">
      <h4>Meeting Id{{ room.roomId }}</h4>
      <b-container fluid>
      <b-row> 
        <b-col 
          cols="6"
          class="video-item">
          <p class="video-header">{{ item.username || '---' }}</p>  
          <video 
            autoplay 
            ref="videos">  
            
          </video>      
        </b-col>
      </b-row>
      </b-container>
    </b-container>
    <b-container fluid class="captions">Captions</b-container>
    <b-container fluid class="media-buttons">Local Video Controls</b-container>
  </b-container>
</template>

<script>
  import { mapActions, mapState } from 'vuex';
  import AuthMixin from '../../mixins/AuthMixin.vue';

  export default {
    name: 'chat-room',
    mixins: [AuthMixin],
    
    data() {
      return {
        roomId: null,
      };
    },

    computed: {
      ...mapState(['setRoom','currentUser', 'roomUsers', 'room'])
    },
    
    methods: {
      ...mapActions(['setCurrentUser', 'updateRoomUsers']),
      
      onRoomJoined(room) {
        console.log('room created', room);
        // store action 
        // redirect to created room
      },

      joinRoom(user) {
        this.$socket.emit('joinRoom', this.roomId, user, this.onRoomJoined)
      },

      exitRoom() {

      },
      muteAudio() {},
      disableVideo() {},
    },
    mounted() {
      this.roomId = this.$route.params.roomId;
      const user = { username: this.user ? this.user.username : null }
      this.joinRoom(user);
    },
  };
</script>

<style scoped>
  .video-item {
    background: #fff;
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
