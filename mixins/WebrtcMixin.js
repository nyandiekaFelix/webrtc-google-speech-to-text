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
    audio_tracks() { return this.localStream.getAudioTracks() },
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
      this.sockets.listener.subscribe('newPeerOffer', this.onOfferReceived);
      // this.sockets.listener.subscribe('newPeerAnswer', this.onAnswerReceived);
    },

    async getUserMedia() {
      if ("mediaDevices" in navigator) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
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
      //this.$refs.localVideo.srcObject = stream;
      this.$nextTick(() => {
        this.$refs.localVideo.srcObject = stream;
        console.log('local', this.$refs.localVideo);
      });

      this.localStream = stream;
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

      console.log('pc', peerConnection);

      this.setupSpeechToText(peerConnection);

      await this.createOffer(peerConnection, socketId);
    },

    async createOffer(peerConnection, socketId) {
      const localDescription = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(localDescription);
      this.$socket.emit('offer', localDescription, socketId);
    },

    onOfferReceived(description) {
      console.log('offer desc', description)
      //const {}
    },

    // onAnswerReceived(data) {
    //   const {}
    // },

    onICECandidate(socketId) {
      const self = this;
      return event => {
        console.log('icecandid8 event\n', event);

        self.$socket.emit('relayICECandidate', {
          socketId,
          iceCandidate: { ...event.candidate }
        });
      }
    },

    addRemoteStream(socketId) {
      const self = this;
      return event => {
        console.log('addstream event\n', event)
        self.peers[socketId].stream = event.streams[0];
      }
    },

    decodeDataChannelPayload(data) {
      if (data instanceof ArrayBuffer) {
        const dec = new TextDecoder('utf-8');
        return Promise.resolve(dec.decode(data));
      } else if (data instanceof Blob) {
        const reader = new FileReader();
        const readPromise = new Promise((accept, reject) => {
          reader.onload = () => accept(reader.result);
          reader.onerror = reject;
        });
        reader.readAsText(data, 'utf-8');
        return readPromise;
      }
    },

    setupSpeechToText(peerConnection) {
      const dataChannel = peerConnection.createDataChannel('results', {
        ordered: true,
        protocol: 'tcp'
      });
      dataChannel.onmessage = evt => {
        this.decodeDataChannelPayload(evt.data)
          .then(strData => {
            const result = JSON.parse(strData);
            // socket emit 'speechToTextData'
          });
      };

      dataChannel.onclose = () => { 
        peerConnection.close();
      };
    },

    receiveSpeechData(data) {},

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
      this.video_tracks.forEach(t => { t.enabled = !t.enabled });
    },

    toggleAudio() {
      this.audio_tracks.forEach(t => { t.enabled = !t.enabled });
    },
  },

  async mounted() {
    this.subscribeRTCListeners();
    await this.getUserMedia();
        
  }
}
