<template>
  <button v-if="!recording" @click="startRecording">Start recording</button>
  <button v-else @click="stopRecording">Stop recording</button>
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

let mediaRecorder = null;

function startRecording() {
  navigator.mediaDevices.getUserMedia({audio: true})
     .then(stream => {
         mediaRecorder = new MediaRecorder(stream);
         recording.value = true;
     })
     .catch(err => {
         props.onError(err.name);
     });
}
function stopRecording() {
  mediaRecorder.stop();
  mediaRecorder.stream.getAudioTracks().forEach(track => track.stop());
  recording.value = false;
}
</script>
