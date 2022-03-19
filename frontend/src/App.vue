<script setup>
import { reactive } from 'vue';
import Recorder from './components/Recorder.vue';

const state = reactive({isBlocked: false, hasNoDevices: false});

function recorderErrorHandler(error) {
  if (error === "NotAllowedError") {
    state.isBlocked = true;
  } else if (error === "NotFoundError") {
    state.hasNoDevices = true;
  }
}
</script>

<template>
  <div v-if="state.isBlocked">
    Access to your microphone is required for this site to work. Please unblock the microphone and refresh the page.
  </div>
  <div v-else-if="state.hasNoDevices">
    You don't have any microphone connected. Please connect a microphone and try again.
  </div>
  <Recorder v-else :onError="recorderErrorHandler"/>
</template>

<style>
</style>
