const servers = [
  { 'url': 'stun:stun.l.google.com:19302' }
];

export const videoConfiguration = {
  data() {
    return {
      peerConnection: null,
      localVideo: null,
      remoteVideo: null,
      stream: null
      constraints: {
        audio: {},
        video: {
          width: 400,
          height: 250
        },
      },           
      servers: servers,
      offerConfigs: {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
      },
    }
  },

  computed: {
    getVideo() { return this.stream.getVideoTracks() },
    getAudio() { return this.stream.getAudioTracks() }
  },

  beforeDestroy() {
    this.stream.getTracks().forEach(track => track.stop());
    this.peerConnection.close();
    this.peerConnection = null;
  },

  methods: {
    async getUserMedia() {
      if ("mediaDevices" in navigator) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(this.constraints)
          this.localVideo.srcObject = stream
          this.localVideo.volume = 0
          this.stream = stream
        } catch (error) {
          console.log("Couldn't get user media:\n", error)
        }
      }
    },
  
    addLocalStream() {
      this.peerConnection.addStream(this.stream)
    },
    
    onAddStream(user, video) {
      this.peerConnection.onaddstream = event => {
        if (!this.remoteVideo.srcObject && event.stream) {
          this.remoteStream = event.stream
          this.remoteVideo.srcObject = this.remoteStream
        }
      }
    },

    pauseVideo() {
      this.stream.getVideoTracks().forEach(t => (t.enabled = !t.enabled))
    },

    pauseAudio() {
      this.stream.getAudioTracks().forEach(t => (t.enabled = !t.enabled))
    },
  },
}
