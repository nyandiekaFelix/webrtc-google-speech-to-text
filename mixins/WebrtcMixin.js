export default {
  data() {
    return {
      peerConnection: null,
      localStream: null,
      peers: {},
      config: {          
        servers: [
          { 'url': 'stun:stun.l.google.com:19302' }
        ],
      },
    };
  },

  computed: {
    getVideoTracks() { return this.stream.getVideoTracks() },
    getAudioTracks() { return this.stream.getAudioTracks() },
    peerMediaElements() { return this.peers },
  },

  //beforeDestroy() {
    //this.localStream.getTracks().forEach(track => track.stop());
    //this.peerConnection.close();
   // this.peerConnection = null;
  //},

  methods: {
    async getUserMedia() {
      if ("mediaDevices" in navigator) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(this.constraints)
          this.localVideo.srcObject = stream
          this.stream = stream
        } catch (error) {
          //alert('In order to continue, Camera & Audio access is required.');
          console.log("Couldn't get user media:\n", error)
        }
      }
    },
  
    addLocalStream() {
      this.peerConnection.addStream(this.stream)
    },
    
    addRemoteStream(peer) {
          
    },

    addPeer(peer) {
      this.peers[peer.socketId] = peer;
      this.addRemoteStream()

    },

    removePeer() {},

    toggleVideo() {
      this.stream.getVideoTracks().forEach(t => { t.enabled = !t.enabled });
    },

    toggleAudio() {
      this.stream.getAudioTracks().forEach(t => { t.enabled = !t.enabled });
    },
  },

  async mounted() {
    this.peerConnection = new RTCPeerConnection(this.config);
    await this.getUserMedia();
  }
}
