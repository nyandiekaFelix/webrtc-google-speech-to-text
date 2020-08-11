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
      sdpConstraints: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      },
      RTCconfig: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:relay.backups.cz' },
          {
            url: 'turn:relay.backups.cz',
            credential: 'webrtc',
            username: 'webrtc'
          },
          {
            url: 'turn:relay.backups.cz?transport=tcp',
            credential: 'webrtc',
            username: 'webrtc'
          },
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
    this.localStream && this.localStream.getTracks().forEach(track => track.stop());
    this.peers = {};
    this.exitRoom();
  },
  
  methods: {
    subscribeRTCListeners() {
      this.$socket.$subscribe('addPeer', this.addPeer);
      this.$socket.$subscribe('addICECandidate', this.addIceCandidate);
      this.$socket.$subscribe('peerOffer', this.onSdp);
      this.$socket.$subscribe('peerAnswer', this.onSdp);
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
        self.$refs[`video-${socketId}`][0].srcObject = event.streams[0];
      }
    },

    async addPeer({ peer, shouldCreateOffer = false }) {
      const { socketId } = peer;
      let offer;

      if(this.peers[socketId]) {
        console.log('Already connected to peer');
        return;
      }

      const peerConnection = new RTCPeerConnection(this.RTCconfig);
      this.peers = { ...this.peers, [socketId]: { peerConnection, ...peer, stream: null, candidateQueue: [] }};

      peerConnection.onicecandidate = this.onICECandidate(socketId, offer);
      peerConnection.ontrack = this.addRemoteStream(socketId);
      peerConnection.oniceconnectionstatechange = this.checkPeerConnection(socketId);
      this.localStream.getTracks()
        .forEach(track => { peerConnection.addTrack(track, this.localStream )});
      if(shouldCreateOffer) await this.createOffer(peerConnection, socketId);
    },

    createOffer(peerConnection, recipientSocket) {
      peerConnection.createOffer(this.sdpConstraints)
        .then(async (localDescription) => {          
          await peerConnection.setLocalDescription(localDescription)
        this.$socket.client.emit('offer', localDescription, recipientSocket);
      })
      .catch(err => { console.log('Error creating offer', err) });
    },

    onSdp({ socketId, description }) {
      const connection = this.peers[socketId].peerConnection;
      const remoteDescription = new RTCSessionDescription(description);
      if(description.type === 'offer') {
        connection.setRemoteDescription(remoteDescription).then(async () => { 
          connection.createAnswer(this.sdpConstraints)
            .then(async answer => {
              await connection.setLocalDescription(answer);
              if(this.peers[socketId].candidateQueue.length) candidateQueue.forEach(candidate => {
                  connection.addIceCandidate(candidate).catch(err => { console.log('ICE err', err) })
                })
              this.$socket.client.emit('answer', connection.localDescription, socketId);
            }).catch(err => { console.log('Error creating answer', err)})
        })
        .catch(err => { console.log(`Error setting offer description`, err) })
      } else if (description.type === 'answer' && !connection.remoteDescription) {
        connection.setRemoteDescription(remoteDescription)
          .catch(err => { console.log('Error setting answer description', err)})
      }
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

    onICECandidate(socketId) {
      const self = this;
      return event => {
        const end = event.candidate === null;
        const connection = self.peers[socketId].peerConnection;
        self.$socket.client.emit('iceCandidate', {
          socketId,
          iceCandidate: event.candidate
        });
      }
    },

    addIceCandidate({ iceCandidate, socketId }) {
      const end = Object.keys(iceCandidate).length === 0;
      const peer = this.peers[socketId];
      if(!end && iceCandidate.sdpMid !== null && iceCandidate.sdpMLineIndex !== null) {
        if(!peer.peerConnection.remoteDescription) {
          const newCandidate = new RTCIceCandidate(iceCandidate);
          peer.candidateQueue.push(newCandidate);
        } else { peer.peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidate)); }
      }
    },

    setupRecorder() {
      const self = this;
      this.sStream = SocketStream.createStream();
      SocketStream(this.$socket.client).emit('speechStream', this.sStream, this.roomId);

      const input = this.audioContext.createMediaStreamSource(this.localStream);

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
