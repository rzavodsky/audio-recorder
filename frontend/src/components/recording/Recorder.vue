<template>
  <button v-if="!recording" @click="startRecording">Start recording</button>
  <button v-else @click="stopRecording">Stop recording</button>
  <StreamWaveform ref="waveform" width=500 height=100 />
</template>

<script setup>
import { ref } from "vue";
import StreamWaveform from './StreamWaveform.vue';

const emit = defineEmits(["error", "finished"]);

const recording = ref(false);
const waveform  = ref(null);

let mediaRecorder = null;
let recordedChunks = [];

function startRecording() {
    navigator.mediaDevices.getUserMedia({audio: { autoGainControl: false, echoCancellation: false, sampleRate: 48000 }})
             .then(stream => {
                 mediaRecorder = new MediaRecorder(stream);

                 mediaRecorder.ondataavailable = e => {
                     recordedChunks.push(e.data);
                 };

                 mediaRecorder.onstop = _ => {
                     const blob = new Blob(recordedChunks, { 'type': "audio/ogg; codecs=opus" });
                     emit('finished', blob);
                     recordedChunks = [];
                     recording.value = false;
                 }

                 mediaRecorder.start();
                 waveform.value.recordFromStream(stream);
                 recording.value = true;
             })
             .catch(err => {
                 emit("error", err.name);
                 console.error(err);
             });
}
function stopRecording() {
    waveform.value.stop();
    mediaRecorder.stop();
    mediaRecorder.stream.getAudioTracks().forEach(track => track.stop());
}
</script>
