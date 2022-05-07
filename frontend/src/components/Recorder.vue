<template>
  <button v-if="!recording" @click="startRecording">Start recording</button>
  <button v-else @click="stopRecording">Stop recording</button>
  <div v-if="downloadLink !== ''">
      <audio ref="audio" :src="downloadLink" controls></audio>
      <div>
          <button @click="uploadFile">Upload file</button>
          <button @click="deleteFile">Delete file</button>
      </div>
  </div>
  <div>
      <Waveform ref="waveform"></Waveform>
  </div>
</template>

<script setup>
import { ref } from "vue";
import Waveform from './Waveform.vue';

const props = defineProps({
    onError: {
        type: Function,
        required: true,
    }
});

const recording = ref(false);
const downloadLink = ref("");
const waveform = ref(null);
const audio = ref(null);

let mediaRecorder = null;
let blob = null;
let recordedChunks = [];

function startRecording() {
    navigator.mediaDevices.getUserMedia({audio: { autoGainControl: false, echoCancellation: false }})
             .then(stream => {
                 waveform.value.setStream(stream);
                 waveform.value.record();
                 mediaRecorder = new MediaRecorder(stream);
                 mediaRecorder.ondataavailable = e => {
                     recordedChunks.push(e.data);
                 };
                 mediaRecorder.onstop = _ => {
                     blob = new Blob(recordedChunks, { 'type': "audio/ogg; codecs=opus" });
                     downloadLink.value = URL.createObjectURL(blob);
                     recordedChunks = [];

                     recording.value = false;
                 }
                 mediaRecorder.start();

                 recording.value = true;
             })
             .catch(err => {
                 props.onError(err.name);
                 console.error(err);
             });
}
function stopRecording() {
    waveform.value.stop();
    mediaRecorder.stop();
    mediaRecorder.stream.getAudioTracks().forEach(track => track.stop());
}
function uploadFile() {
    let formData = new FormData();
    formData.set("audioFile", blob);
    fetch("/api/upload", {
        method: "POST",
        body: formData,
    });
}
function deleteFile() {
    blob = null;
    downloadLink.value = "";
}
</script>
