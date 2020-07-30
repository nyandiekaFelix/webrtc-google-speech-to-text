import RecordRTC from 'recordrtc';
import SocketStream from 'socket.io-stream';

export default {
  data() {
    return {
      localStream: null,
      peers: {},
      micOn: false,
      videoOn: true,
      recorderTimeSlice: 5000,
      constraints: { video: false, audio: true },
      recorder: null,
      audioContext: null,
      scriptNode: null,
      sStream: null,
      RTCconfig: { 
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
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
        //console.log('mic', this.micOn);
        const self = this;
        this.scriptNode.connect(this.audioContext.destination);
        setInterval(() => {
          //self.scriptNode.disconnect(this.audioContext.destination);
          console.log('srnod', self.scriptNode)
        }, 5000)
        //this.sendSpeechData();

        //this.recorder.start(this.recorderTimeSlice); 
        //console.log('recorder', this.recorder.state)
      } else {
        this.scriptNode.disconnect(this.audioContext.destination);
        //this.recorder.stop();console.log('recorder', this.recorder.state)

      }
    }
  },

  beforeDestroy() {
    this.localStream.getTracks().forEach(track => track.stop());
    this.peers = {};
    //this.$socket.emit('exitRoom', this.roomId, this.currentUser.socketId);
  },

  methods: {
    subscribeRTCListeners() {
      this.sockets.listener.subscribe('addPeer', this.addPeer);
      this.sockets.listener.subscribe('addICECandidate', this.addICECandidate);
      this.sockets.listener.subscribe('peerOffer', this.onPeerOffer);
      this.sockets.listener.subscribe('peerAnswer', this.onPeerAnswer);
      this.sockets.listener.subscribe('transcriptionData', this.receiveTranscription);
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
      this.$nextTick(() => {
        this.$refs.localVideo.srcObject = stream;
      });

      this.localStream = stream;
      //this.audio_tracks[0].enabled = false;
      this.setupRecorder();
    },

    addRemoteStream(socketId) {
      const self = this;
      return event => {
        self.peers[socketId].stream = event.streams[0];
      }
    },

    async addPeer({ peer, shouldCreateOffer = false }) {
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

      this.localStream.getTracks()
        .forEach(track => { peerConnection.addTrack(track, this.localStream )});

      if(shouldCreateOffer) await this.createOffer(peerConnection, socketId);
    },

    async createOffer(peerConnection, recipientSocket) {
      const localDescription = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(localDescription);
      this.$socket.emit('offer', localDescription, recipientSocket);
    },

    onPeerOffer({ caller, description }) {
      const connection = this.peers[caller].peerConnection;
      const remoteDescription = new RTCSessionDescription(description);
      
      connection.setRemoteDescription(remoteDescription).then(() => {
        connection.createAnswer()
          .then(async (answer) => {
            await connection.setLocalDescription(answer);
            this.$socket.emit('answer', answer, caller);
          });
      });
    },

    onPeerAnswer({ recipient, description }) {
      const connection = this.peers[recipient].peerConnection;
      const remoteDescription = new RTCSessionDescription(description);
      connection.setRemoteDescription(remoteDescription);
    },

    onICECandidate(socketId) {
      const self = this;
      return event => {
        if(event.candidate) {
          self.$socket.emit('iceCandidate', {
            socketId,
            iceCandidate: { ...event.candidate }
          });
        }
      }
    },

    addICECandidate(candidate) {
      const { iceCandidate, socketId } = candidate;
      const connection = this.peers[socketId].peerConnection;

      connection.addIceCandidate(new RTCIceCandidate(iceCandidate));
    },

    setupRecorder() {
      const self = this;
      this.sStream = SocketStream.createStream();
      SocketStream(this.$socket).emit('speechStream', this.sStream);

      const audioStream = new MediaStream(this.audio_tracks);

      const input = this.audioContext.createMediaStreamSource(audioStream);
      this.audioInput = input;
      console.log('aud ctx', this.audioContext);
      console.log('aud inp', input);
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
      /* const recorder = new MediaRecorder(audioStream, {
        type: 'audio', 
        mimeType: 'audio/webm',
        sampleRate: 44100,
        //recorderType: MediaStreamRecorder,
        //numberOfAudioChannels: 1,
        timeSlice: 5000,
        desiredSampRate: 16000,
        ignoreMutedMedia: true
      });

      recorder.ondataavailable = (event) => { console.log('dataavailable', event)};
      recorder.onstart = (event) => { console.log('started recording', event)};
      recorder.onstop = event => { console.log('stopped recording', event)};
      recorder.onerror = event => { console.log('error', event)};
      
      this.recorder = recorder;
      */
    },

    ssBuffer(buffer, sampleRate, outSampleRate) {
      if (outSampleRate == sampleRate) {
        return buffer;
      }
      if (outSampleRate > sampleRate) {
        throw "downsampling rate show be smaller than original sample rate";
      }
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

    sendSpeechData() {
      
      //SocketStream(this.$socket).emit('speechStream', stream, {
        //name: '_temp/stream.wav',
        //size: blob.size
      //});
      // pipe the audio blob to the read stream
      //SocketStream.createBlobReadStream(blob).pipe(stream);
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
      this.videoOn = this.video_tracks[0].enabled;
    },

    toggleMic() {
      this.audio_tracks[0].enabled = !(this.audio_tracks[0].enabled);
      this.micOn = this.audio_tracks[0].enabled;
      //this.recorder.stop();
    },
  },

  async mounted() {
    this.subscribeRTCListeners();
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}
