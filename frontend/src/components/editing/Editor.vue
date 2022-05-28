<template>
    <div class="waveformContainer">
        <div>
            <Waveform class="waveform" v-if="audioClips.before != null" :source="audioClips.before.audioBuffer"
                      :style="{ left: audioClips.before.pixelOffset + 'px' }" />
            <Waveform class="waveform" v-if="audioClips.recorded != null" :source="audioClips.recorded.audioBuffer" markers
                      @markerChanged="recalculateTimes" ref="recordedWaveform"
                      :style="{ left: audioClips.recorded.pixelOffset + 'px' }" />
            <Waveform class="waveform" v-if="audioClips.after != null" :source="audioClips.after.audioBuffer"
                      :style="{ left: audioClips.after.pixelOffset + 'px' }" />
        </div>
        <div class="cursor" :style="{ left: cursorPos + 'px' }"></div>
    </div>
    <div>
        <div>
            Audio file before: <input ref="beforeInput" type="file">
        </div>
        <div>
            Audio file after: <input ref="afterInput" type="file">
        </div>
    </div>
    <button v-if="!playing" @click="play">Play</button>
    <button v-else @click="pause">Pause</button>
</template>

<script setup>
import Waveform from "./Waveform.vue";
import { onMounted, reactive, ref, nextTick } from "vue";
import { WAVEFORM_PIXELS_PER_SECOND } from "/src/constants.js";
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

const cursorPos = ref(0);
let startingOffset = 0;
let playing = ref(false);

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
            clip.pixelOffset = (clip.startTime - clip.offset + startingOffset) * WAVEFORM_PIXELS_PER_SECOND;
        }
    }
}

let lastTimestamp = null;
function animateCursor(timestamp) {
    if (playing.value) requestAnimationFrame(animateCursor);
    else {
        lastTimestamp = null;
        return;
    }

    if (lastTimestamp == null) {
        lastTimestamp = timestamp;
        return;
    }
    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    cursorPos.value += delta * WAVEFORM_PIXELS_PER_SECOND / 1000;
}

let playingAudioElements = [];
let playingAudioTimeouts = [];
function play() {
    const clips = [audioClips.before, audioClips.recorded, audioClips.after];

    let lastClip = null;

    for (const index in clips) {
        const clip = clips[index];
        if (clip == null) continue;
        let audio = new Audio(clip.url);
        audio.currentTime = clip.offset;
        const startTimeout = setTimeout(() => audio.play(), clip.startTime * 1000);
        const stopTimeout = setTimeout(() => audio.pause(), (clip.startTime + clip.duration) * 1000)
        lastClip = clip;
        playingAudioElements.push(audio);
        playingAudioTimeouts.push(startTimeout, stopTimeout);
    }

    const pauseTimeout = setTimeout(() => pause(), (lastClip.startTime + lastClip.duration) * 1000);
    playingAudioTimeouts.push(pauseTimeout);

    cursorPos.value = startingOffset * WAVEFORM_PIXELS_PER_SECOND;
    playing.value = true;
    animateCursor();
}

function pause() {
    playing.value = false;
    for (const timeout of playingAudioTimeouts) {
        clearTimeout(timeout);
    }
    for (const audio of playingAudioElements) {
        audio.pause();
    }
}
</script>

<style>
.waveform {
    margin-bottom: 10px;
}

.waveform:last-child {
    margin-bottom: 0;
}

.waveformContainer {
    width: 500px;
    overflow: auto;
    position: relative;
}

.cursor {
    position: absolute;
    width: 2px;
    background: black;
    height: 100%;
    top: 0;
}
</style>
