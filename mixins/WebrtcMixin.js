import SocketStream from 'socket.io-stream';

export default {
  data() {
    return {
      localStream: null,
      peers: {},
      micOn: false,
      videoOn: true,
      constraints: { video: true, audio: true },
      audioContext: null,
      scriptNode: null,
      sStream: null,
      captions: '',
      RTCconfig: {
        mandatory: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        },
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { 
            urls: 'turn:numb.viagenie.ca',
            credential: 'nyandieka.f@gmail.com',
            username: 'nyandieka.f@gmail.com'
          }
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

  watch: {
    micOn() {
      if(this.micOn) {
        if(this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        this.scriptNode.connect(this.audioContext.destination);
      } else {
        this.scriptNode.disconnect(this.audioContext.destination);
      }
    }
  },

  beforeDestroy() {
    this.localStream.getTracks().forEach(track => track.stop());
    this.peers = {};
  },

  methods: {
    subscribeRTCListeners() {
      this.$socket.$subscribe('addPeer', this.addPeer);
      this.$socket.$subscribe('addICECandidate', this.addIceCandidate);
      this.$socket.$subscribe('peerOffer', this.onPeerOffer);
      this.$socket.$subscribe('peerAnswer', this.onPeerAnswer);
      this.$socket.$subscribe('transcriptionData', this.receiveTranscription);
      this.$socket.$subscribe('removePeer', this.removePeer);
    },

    async getUserMedia() {
      if ("mediaDevices" in navigator) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
          this.addLocalStream(stream);
        } catch (error) {
          //alert('In order to continue, Camera & Audio access is required.');
          console.log("Error getting user media:\n", error)
        }
      } else {
        console.log("Could not find an available media device");
      }
    },
  
    addLocalStream(stream) {
      this.$nextTick(() => {
        this.$refs.localVideo.srcObject = stream;
      });

      this.localStream = stream;
      this.audio_tracks[0].enabled = false;
      this.setupRecorder();
    },

    addRemoteStream(socketId) {
      const self = this;
      return event => {
        self.peers[socketId].stream = event.streams[0];
      }
    },

    addPeer({ peer, shouldCreateOffer = false }) {
      const { socketId } = peer;

      if(this.peers[socketId]) {
        console.log('Already connected to peer');
        return;
      }

      const peerConnection = new RTCPeerConnection(this.RTCconfig);
      this.peers = { ...this.peers, [socketId]: { peerConnection, ...peer, stream: null }};

      peerConnection.onicecandidate = this.onICECandidate(socketId);
      peerConnection.ontrack = this.addRemoteStream(socketId);
      peerConnection.oniceconnectionstatechange = this.checkPeerConnection(socketId);

      if(shouldCreateOffer) this.createOffer(peerConnection, socketId);
    },

    createOffer(peerConnection, recipientSocket) {
      peerConnection.createOffer().then(localDescription => {
        peerConnection.setLocalDescription(localDescription)
          .then(() => {
            this.$socket.client.emit('offer', localDescription, recipientSocket);
          })
      })
      .catch(err => { console.log('Error creating offer', err) });
    },

    onPeerOffer({ caller, description }) {
      const connection = this.peers[caller].peerConnection;
      const remoteDescription = new RTCSessionDescription(description);
      
      connection.setRemoteDescription(remoteDescription).then(() => {
        connection.createAnswer()
          .then(async answer => {
            await connection.setLocalDescription(answer)
            this.$socket.client.emit('answer', connection.localDescription, caller);
          })
      })
      .catch(err => { console.log('Error answering offer', err) })
    },

    async onPeerAnswer({ recipient, description }) {
      const connection = this.peers[recipient].peerConnection;
      const remoteDescription = new RTCSessionDescription(description);
      await connection.setRemoteDescription(remoteDescription).catch(err => { console.log('receive ans err', err)});
    },

    onICECandidate(socketId) {
      const self = this;
      return event => {
        if(event.candidate) {
          self.$socket.client.emit('iceCandidate', {
            socketId,
            iceCandidate: { ...event.candidate }
          });
        }
      }
    },

    addIceCandidate({ iceCandidate, socketId }) {
      if(iceCandidate.sdpMid && iceCandidate.sdpMLineIndex)
        this.peers[socketId].peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidate))
          .catch(err => { console.log('ice err', err) });
    },

    setupRecorder() {
      const self = this;
      this.sStream = SocketStream.createStream();
      SocketStream(this.$socket.client).emit('speechStream', this.sStream, this.roomId);

      const audioStream = new MediaStream(this.audio_tracks);

      const input = this.audioContext.createMediaStreamSource(audioStream);

      const bufferSize = 2048;
      const scriptNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
      this.scriptNode = scriptNode; 
      scriptNode.onaudioprocess = audioProcessingEvent => {
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const outputBuffer = audioProcessingEvent.outputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        var outputData = outputBuffer.getChannelData(0);

        for (var sample = 0; sample < inputBuffer.length; sample++) {
          outputData[sample] = inputData[sample];
        } 
      
        const buffer = new SocketStream.Buffer(self.ssBuffer(inputData, 44100, 16000));
        self.sStream.write(buffer);
      }
      input.connect(scriptNode);
      this.scriptNode = scriptNode;
    },

    ssBuffer(buffer, sampleRate, outSampleRate) {
      if (outSampleRate == sampleRate) return buffer;
      if (outSampleRate > sampleRate) throw "downsampling rate should be smaller than original sample rate";

      const sampleRateRatio = sampleRate / outSampleRate;
      const newLength = Math.round(buffer.length / sampleRateRatio);
      const result = new Int16Array(newLength);
      
      let offsetResult = 0;
      let offsetBuffer = 0;
      while (offsetResult < result.length) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        let accum = 0;
        let count = 0;
        for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
          accum += buffer[i];
          count++;
        }
  
        result[offsetResult] = Math.min(1, accum / count) * 0x7FFF;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
      }
      return result.buffer;
    },

    receiveTranscription(transcription) {
      console.log('transcription', transcription);
      this.captions = transcription;
    },

    removePeer(socketId) {
      const peers = { ...this.peers };
      delete peers[socketId];
      this.peers = peers;
    },

    checkPeerConnection(socketId) {
      const self = this;
      return event => {
        const peerState = self.peers[socketId].peerConnection.iceConnectionState;
        if (peerState === "closed") {
          self.removePeer(socketId);
        }
      };
    },

    toggleVideo() {
      this.video_tracks[0].enabled = !(this.video_tracks[0].enabled);
      this.videoOn = this.video_tracks[0].enabled;
    },

    toggleMic() {
      this.audio_tracks[0].enabled = !(this.audio_tracks[0].enabled);
      this.micOn = this.audio_tracks[0].enabled;
    },
  },

  async mounted() {
    this.subscribeRTCListeners();
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}
