const Speech = require('@google-cloud/speech');

const payload = {
  config: {
    encoding: 'LINEAR16',
    // sampleRateHertz: 16000,
    sampleRateHertz: 44100,
    languageCode: 'en-US',
    alternativeLanguageCodes: ['en-US', 'ja-JP'],
    // enableWordTimeOffsets: true,
    enableAutomaticPunctuation: true,
    model: 'default',
  },
  interimResults: true,
  verbose: true,
};

async function speechToText(audio) {
  const client = new Speech.SpeechClient();
  payload.audio.content = audio;

  const responses = await client.recognize(payload);
  const results = responses[0].results[0].alternatives[0];
  return { 
    'transcript' : results.transcript,
  };
}

function speechStreamToText(stream, callback) {
  const recognizeStream = client
    .streamingRecognize(payload)
    .on('error', error => { console.log('Speech stream error:\n', error) })
    .on('data', data => {
      callback({
        transcript: data.results[0].alternatives[0].transcript,
      });
    });

  stream.pipe(recognizeStream);
}

module.exports = { speechToText, speechStreamToText };
