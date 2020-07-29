const Speech = require('@google-cloud/speech');

const payload = {
  config: {
    encoding: 'LINEAR16',
    // sampleRateHertz: 16000,
    sampleRateHertz: 44100,
    languageCode: 'en-US',
    // enableWordTimeOffsets: true,
    enableAutomaticPunctuation: true,
    model: 'default',
  },
  interimResults: true,
  verbose: true,
};

function initSpeechToText() {
  const client = new Speech.SpeechClient();

  const recognizeStream = client
    .streamingRecognize(payload)
    .on('error', console.error)
    .on('data', data => {
      if (data.results && data.results[0]) {
        JSON.stringify({
          isFinal: data.results[0].isFinal,
          text: data.results[0].alternatives[0].transcript,
        });
      }
    });
}

module.exports = initSpeechToText;
