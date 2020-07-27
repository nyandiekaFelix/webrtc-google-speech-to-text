export default {
  data() {
    return {
      localStream: null,
      peers: {},
      constraints: { video: true, audio: true }
      RTCconfig: {          
        iceServers: [
          { 'url': 'stun:stun.l.google.com:19302' }
        ],
      },
    };
  },

  computed: {
    video_tracks() { return this.localStream.getVideoTracks() },
    audio_tracks() { return this.localStream.getAudioTracks() },
    peerRefs() { 
      return Object.keys(this.peers).forEach(peer => `video-${peer}`);
    }
  },

  beforeDestroy() {
    this.localStream.getTracks().forEach(track => track.stop());
  },

  methods: {
    async getUserMedia() {
      if ("mediaDevices" in navigator) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
          this.addLocalStream(stream);
        } catch (error) {
          //alert('In order to continue, Camera & Audio access is required.');
          console.log("Couldn't get user media:\n", error)
        }
      }
    },
  
    addLocalStream(stream) {
      this.$refs.localVideo.srcObject = stream;
      this.localStream = stream;
    },
    
    addRemoteStream(peer) {
          
    },

    addPeer({ socketId }) {
      if(this.peers[socketId]) {
        console.log('Already connected to peer');
        return;
      }
      const peerConnection = new RTCPeerConnection(this.RTCconfig);
      this.peers[socketId] = peerConnection;

      peerConnection.onicecandidate = this.onICECandidate(socketId);
      peerConnection.onaddstream = this.onAddStream(socketId);

      this.addRemoteStream()

    },

    onICECandidate(socketId) {
      return event => {
        console.log('event', event);

        this.$socket.emit(''relayICECandidate', {
          socketId,
          iceCandidate: { ...event.candidate }
        });
      }
    },

    onAddStream(socketId) {
      // create media elements
      return event => {
        this.peerRefs.push() = 
      }
    },

    removePeer() {},

    toggleVideo() {
      this.video_tracks.forEach(t => { t.enabled = !t.enabled });
    },

    toggleAudio() {
      this.audio_tracks.forEach(t => { t.enabled = !t.enabled });
    },
  },

  async mounted() {
    await this.getUserMedia();
  }
}
