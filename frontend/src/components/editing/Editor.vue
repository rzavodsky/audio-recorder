<template>
    <div class="waveformContainer">
        <Waveform class="waveform" v-if="sources.beforeSource != null" :source="sources.beforeSource" />
        <Waveform class="waveform" v-if="sources.recordedSource != null" :source="sources.recordedSource" />
        <Waveform class="waveform" v-if="sources.afterSource != null" :source="sources.afterSource" />
    </div>
</template>

<script setup>
import Waveform from "./Waveform.vue"
import { onMounted, reactive } from "vue";
const props = defineProps({
    recordedAudio: {
        type: Blob,
        required: true,
    }
});

const sources = reactive({
    recordedSource: null,
    beforeSource: null,
    afterSource: null,
});


onMounted(async () => {
    sources.recordedSource = await props.recordedAudio.arrayBuffer();
});

</script>

<style>
 .waveform {
     margin-bottom: 10px;
 }

 .waveformContainer {
     width: 500px;
     overflow: auto;
 }
</style>
