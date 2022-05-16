<template>
  <div v-if="state.isBlocked">
    Access to your microphone is required for this site to work. Please unblock the microphone and refresh the page.
  </div>
  <div v-else-if="state.hasNoDevices">
    You don't have any microphone connected. Please connect a microphone and try again.
  </div>
  <Recorder v-else-if="state.recording" @error="recorderErrorHandler" @finished="recorderFinished"/>
  <Editor v-else :recordedAudio="state.recordedBlob" />
</template>

<script setup>
import { reactive } from 'vue';
import Recorder from './components/recording/Recorder.vue';
import Editor from './components/editing/Editor.vue';

const state = reactive({isBlocked: false, hasNoDevices: false, recording: true, recordedBlob: null});

function recorderErrorHandler(error) {
  if (error === "NotAllowedError") {
    state.isBlocked = true;
  } else if (error === "NotFoundError") {
    state.hasNoDevices = true;
  }
}

function recorderFinished(blob) {
  state.recordedBlob = blob;
  state.recording = false;
}
</script>

<style>
</style>
