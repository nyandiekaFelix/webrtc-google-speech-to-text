const Speech = require('@google-cloud/speech');

const payload = {
  config: {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
    alternativeLanguageCodes: ['en-US', 'ja-JP'],
    enableWordTimeOffsets: true,
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
  const client = new Speech.SpeechClient();
  const recognizeStream = client
    .streamingRecognize(payload)
    .on('error', error => { console.log('Speech stream error:\n', error) })
    .on('data', data => {
      callback(data.results[0].alternatives[0].transcript);
    });

  stream.pipe(recognizeStream);
}

module.exports = { speechToText, speechStreamToText };
