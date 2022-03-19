<template>
  <button v-if="!recording" @click="startRecording">Start recording</button>
  <button v-else @click="stopRecording">Stop recording</button>
  <div v-if="downloadLink !== ''">
      <audio :src="downloadLink" controls></audio>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
    onError: {
        type: Function,
        required: true,
    }
});

const recording = ref(false);
const downloadLink = ref("");

let mediaRecorder = null;
let recordedChunks = [];

function startRecording() {
    navigator.mediaDevices.getUserMedia({audio: true})
             .then(stream => {
                 mediaRecorder = new MediaRecorder(stream);
                 mediaRecorder.ondataavailable = e => {
                     recordedChunks.push(e.data);
                 };
                 mediaRecorder.onstop = e => {
                     let blob = new Blob(recordedChunks, { 'type': "audio/ogg; codecs=opus" });
                     downloadLink.value = URL.createObjectURL(blob);
                     recordedChunks = [];

                     recording.value = false;
                 }
                 mediaRecorder.start();

                 recording.value = true;
             })
             .catch(err => {
                 props.onError(err.name);
             });
}
function stopRecording() {
    mediaRecorder.stop();
    mediaRecorder.stream.getAudioTracks().forEach(track => track.stop());
}
</script>
