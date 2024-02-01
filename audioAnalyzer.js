// audioAnalyzer.js
let audioContext;
let analyser;
let bufferLength;
let dataArray;
let onBeatDetectedCallback;

export function initializeAudioAnalyzer(callback) {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  onBeatDetectedCallback = callback;
}

export function loadAudio(uri) {
  fetch(uri)
    .then(response => response.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data))
    .then(buffer => {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      source.start(0);
      detectBeat();
    })
    .catch(error => console.error('Error loading audio:', error));
}

function detectBeat() {
  analyser.getByteFrequencyData(dataArray);
  const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

  // Adjust this threshold based on your requirements
  const threshold = 150;

  if (average > threshold) {
    onBeatDetectedCallback();
  }

  requestAnimationFrame(detectBeat);
}
