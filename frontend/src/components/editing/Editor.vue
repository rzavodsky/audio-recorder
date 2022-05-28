<template>
    <div class="waveformContainer">
        <Waveform class="waveform" v-if="audioClips.before != null" :source="audioClips.before.audioBuffer"
            :style="{ left: audioClips.before.pixelOffset + 'px' }" />
        <Waveform class="waveform" v-if="audioClips.recorded != null" :source="audioClips.recorded.audioBuffer" markers
            @markerChanged="recalculateTimes" ref="recordedWaveform"
            :style="{ left: audioClips.recorded.pixelOffset + 'px' }" />
        <Waveform class="waveform" v-if="audioClips.after != null" :source="audioClips.after.audioBuffer"
            :style="{ left: audioClips.after.pixelOffset + 'px' }" />
    </div>
    <div>
        <div>
            Audio file before: <input ref="beforeInput" type="file">
        </div>
        <div>
            Audio file after: <input ref="afterInput" type="file">
        </div>
    </div>
    <button @click="play">Play</button>
</template>

<script setup>
import Waveform from "./Waveform.vue"
import { onMounted, reactive, ref, nextTick } from "vue";
const props = defineProps({
    recordedAudio: {
        type: Blob,
        required: true,
    }
});

const audioClips = reactive({
    before: null,
    recorded: null,
    after: null,
});


const beforeInput = ref(null);
const afterInput = ref(null);

const recordedWaveform = ref(null);
let startingOffset = 0;

onMounted(async () => {
    audioClips.recorded = await getAudioData(props.recordedAudio);
    nextTick(recalculateTimes);

    beforeInput.value.onchange = e => {
        getAudioData(e.target.files[0]).then(data => {
            audioClips.before = data;
            nextTick(recalculateTimes);
        });
    };

    afterInput.value.onchange = e => {
        getAudioData(e.target.files[0]).then(data => {
            audioClips.after = data;
            nextTick(recalculateTimes);
        });
    };
});


async function getAudioData(file) {
    const audioCtx = new AudioContext();
    const url = URL.createObjectURL(file);

    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0, arrayBuffer.byteLength));
    return {
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        url: url,
        audioBuffer: audioBuffer,
    }
}

function recalculateTimes() {
    const beginning = recordedWaveform.value.getMarkerPos(0);
    const end = recordedWaveform.value.getMarkerPos(1);
    audioClips.recorded.duration = end - beginning;

    const clips = [audioClips.before, audioClips.recorded, audioClips.after];

    let currentTime = 0;

    for (let clip of clips) {
        if (clip != null) {
            clip.startTime = currentTime;
            clip.offset = 0;
            currentTime += clip.duration;
        }
    }
    audioClips.recorded.offset = beginning;

    startingOffset = 0;
    for (const clip of clips) {
        if (clip != null && clip.offset > clip.startTime + startingOffset) {
            startingOffset = clip.offset - clip.startTime;
        }
    }

    for (let clip of clips) {
        if (clip != null) {
            clip.pixelOffset = (clip.startTime - clip.offset + startingOffset) * 48000 / 512;
        }
    }
}
function play() {
    const clips = [audioClips.before, audioClips.recorded, audioClips.after];

    for (const index in clips) {
        let clip = clips[index];
        if (clip == null) continue;
        clip.audio = new Audio(clip.url);
        clip.audio.currentTime = clip.offset;
        setTimeout(() => {
            clip.audio.play();
            if (index > 0) {
                clips[index - 1]?.audio.pause();
            }
        }, clip.startTime * 1000);
    }
}
</script>

<style>
.waveform {
    margin-bottom: 10px;
}

.waveformContainer {
    width: 500px;
    overflow: auto;
    position: relative;
}
</style>
