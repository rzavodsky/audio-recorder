<template>
    <WaveformContainer ref="waveforms" @markerChanged="recalculateTimes" :audioClips="audioClips" :playing="playing" v-model="cursorPos" />
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
import WaveformContainer from "./WaveformContainer.vue";
import { onMounted, reactive, ref, nextTick, watch } from "vue";
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
const waveforms = ref(null);

const cursorPos = ref(0);

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
    const beginning = waveforms.value.getMarkerPos(0);
    const end = waveforms.value.getMarkerPos(1);
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

}


let playingAudioElements = [];
let playingAudioTimeouts = [];
function play() {
    const clips = [audioClips.before, audioClips.recorded, audioClips.after];

    let lastClip = null;

    for (const index in clips) {
        const clip = clips[index];
        if (clip == null) continue;
        if (clip.startTime + clip.duration < cursorPos.value) continue; // Skip if cursor is after this clip

        let audio = new Audio(clip.url);

        if (clip.startTime >= cursorPos.value) { // Cursor is before this clip
            audio.currentTime = clip.offset;
            const startTimeout = setTimeout(() => audio.play(), (clip.startTime - cursorPos.value) * 1000);
            const stopTimeout = setTimeout(() => audio.pause(), (clip.startTime + clip.duration - cursorPos.value) * 1000)
            playingAudioTimeouts.push(startTimeout, stopTimeout);
        } else { // Cursor is inside this clip
            audio.currentTime = cursorPos.value - clip.startTime + clip.offset;
            const stopTimeout = setTimeout(() => audio.pause(), (clip.startTime + clip.duration - cursorPos.value) * 1000);
            audio.play();
            playingAudioTimeouts.push(stopTimeout);
        }

        lastClip = clip;
        playingAudioElements.push(audio);
    }

    if (lastClip == null || lastClip.startTime + lastClip.duration - cursorPos.value < 0.05) { // If we wouldn't play any clip, return cursor to the beginning and play again.
        cursorPos.value = 0;
        play();
        return;
    };
    const pauseTimeout = setTimeout(() => pause(), (lastClip.startTime + lastClip.duration - cursorPos.value) * 1000);
    playingAudioTimeouts.push(pauseTimeout);

    playing.value = true;
}

function pause() {
    playing.value = false;
    for (const timeout of playingAudioTimeouts) {
        clearTimeout(timeout);
    }
    for (const audio of playingAudioElements) {
        audio.pause();
    }
    playingAudioTimeouts = [];
    playingAudioElements = [];
}
</script>

<style>
.waveform {
    margin-bottom: 10px;
}

.waveform:last-child {
    margin-bottom: 0;
}

</style>
