<template>
  <button v-if="!recording" @click="startRecording">Start recording</button>
  <button v-else @click="stopRecording">Stop recording</button>
  <div v-if="downloadLink !== ''">
      <audio :src="downloadLink" controls></audio>
      <div>
          <button @click="uploadFile">Upload file</button>
          <button @click="deleteFile">Delete file</button>
      </div>
  </div>
  <div>
      {{statusMessage}}
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

const statusMessage = ref("");
const recording = ref(false);
const downloadLink = ref("");

let mediaRecorder = null;
let blob = null;
let recordedChunks = [];

function startRecording() {
    navigator.mediaDevices.getUserMedia({audio: true})
             .then(stream => {
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
             });
}
function stopRecording() {
    mediaRecorder.stop();
    mediaRecorder.stream.getAudioTracks().forEach(track => track.stop());
}
function uploadFile() {
    let formData = new FormData();
    formData.set("audioFile", blob);
    fetch("/api/upload", {
        method: "POST",
        body: formData,
    }).then(res => {
        if (res.ok) {
            statusMessage.value = "Uploaded";
            setTimeout(() => statusMessage.value = "", 5000);
        } else {
            statusMessage.value = "Uploading failed";
            setTimeout(() => statusMessage.value = "", 5000);
        }
    }).catch(err => {
        statusMessage.value = "Uploading failed";
        setTimeout(() => statusMessage.value = "", 5000);

    })
}
function deleteFile() {
    blob = null;
    downloadLink.value = "";
}
</script>
