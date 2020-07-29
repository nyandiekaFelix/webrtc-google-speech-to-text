export default {
  data() {
    return {
      localStream: null,
      localVideoElement: null,
      peers: {},
      constraints: { video: true, audio: true },
      RTCconfig: {          
        iceServers: [
          { 'url': 'stun:stun.l.google.com:19302' }
        ],
      },
    };
  },

  computed: {
    video_tracks() { return this.localStream.getVideoTracks() },
    videoEnabled() { return this.video_tracks[0].enabled },
    audio_tracks() { return this.localStream.getAudioTracks() },
    micMuted() { return this.audio_tracks[0].enabled },
    peerRefs() { 
      return Object.keys(this.peers).forEach(peer => `video-${peer}`);
    }
  },

  beforeDestroy() {
    this.localStream.getTracks().forEach(track => track.stop());
    this.peers = {};
    // socket disconnect?
  },

  methods: {
    subscribeRTCListeners() {
      this.sockets.listener.subscribe('addPeer', this.addPeer);
      this.sockets.listener.subscribe('addICECandidate', this.addICECandidate);
      this.sockets.listener.subscribe('peerSessionDescription', this.onSessionDescription);
      this.sockets.listener.subscribe('transcriptionData', this.receiveTranscription);
    },

    async getUserMedia() {
      if ("mediaDevices" in navigator) {
        try {
          const stream = new MediaStream()//await navigator.mediaDevices.getUserMedia(this.constraints);
          this.addLocalStream(stream);
        } catch (error) {
          //alert('In order to continue, Camera & Audio access is required.');
          console.log("Couldn't get user media:\n", error)
        }
      } else {
        console.log("This browser does not support the 'getUserMedia' API");
      }
    },
  
    addLocalStream(stream) {
      this.$nextTick(() => {
        this.$refs.localVideo.srcObject = stream;
      });

      this.localStream = stream;
    },

    addRemoteStream(socketId) {
      const self = this;
      return event => {
        console.log('added strm', event.streams);

        self.peers[socketId].stream = event.streams[0];
        this.setupSpeechToText(event.streams[0]);
      }
    },

    async addPeer(peer) {
      const { socketId } = peer;

      if(this.peers[socketId]) {
        console.log('Already connected to peer');
        return;
      }

      const peerConnection = new RTCPeerConnection(this.RTCconfig);
      this.peers[socketId] = { peerConnection, ...peer, stream: null };

      peerConnection.onicecandidate = this.onICECandidate(socketId);
      peerConnection.ontrack = this.addRemoteStream(socketId);
      peerConnection.oniceconnectionstatechange = this.removePeer(socketId);

      peerConnection.addStream(this.localStream);

      await this.createOffer(peerConnection, socketId);
    },

    async createOffer(peerConnection, socketId) {
      const localDescription = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(localDescription);
      this.$socket.emit('sessionDescription', localDescription, socketId);
    },

    onSessionDescription({ caller, description }) {
      const connection = this.peers[caller].peerConnection;
      const remoteDescription = new RTCSessionDescription(description)
      
      connection.setRemoteDescription(remoteDescription).then(() => {
        if(description.type === 'offer'){
          connection.createAnswer()
            .then(answer => {
              connection.setLocalDescription(answer)
                .then(() => {
                  this.$socket.emit('sessionDescription', answer, caller);
                })
            });
        }
      });

    },

    onICECandidate(socketId) {
      const self = this;
      return event => {
        console.log('sentID', socketId);
        self.$socket.emit('iceCandidate', {
          socketId,
          iceCandidate: { ...event.candidate }
        });
      }
    },

    addICECandidate(candidate) {
      const { socketId, iceCandidate } = candidate;
      console.log('receivedId', socketId);
      const connection = this.peers[socketId].peerConnection;

      connection.addIceCandidate(new RTCIceCandidate(iceCandidate));
    },

    setupSpeechToText(stream) {
      const options = {
        audioBitsPerSecond : 128000,
        videoBitsPerSecond : 2500000,
        mimeType : 'video/mp4'
      };
      const speechRecorder = new MediaRecorder(stream, options);
      speechRecorder.ondataavailable = this.sendSpeechData;
    },

    sendSpeechData(event) {
      console.log('data available event', event);
      this.$socket.emit('speechToTextData', data);
    },

    receiveTranscription(data) {
      console.log('transcription', data);
    },

    removePeer(socketId) {
      const self = this;
      return event => {
        const peerState = self.peers[socketId].peerConnection.iceConnectionState;
        if (peerState === "failed" || peerState === "closed" || peerState === "disconnected") {
          delete self.peers[socketId];
        }
      };
    },

    toggleVideo() {
      this.video_tracks[0].enabled = !(this.video_tracks[0].enabled);
    },

    toggleMic() {
      this.audio_tracks[0].enabled = !(this.audio_tracks[0].enabled);
    },
  },

  async mounted() {
    this.subscribeRTCListeners();
  }
}
