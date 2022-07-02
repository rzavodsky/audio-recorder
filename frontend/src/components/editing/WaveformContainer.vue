<template>
    <div class="outerContainer" ref="outerContainer">
        <div class="timeline" ref="timeline" />
        <div class="waveformContainer" ref="waveformContainer">
            <div>
                <Waveform v-if="props.audioClips.before" :source="props.audioClips.before.audioBuffer"
                    ref="beforeWaveform" :style="{ left: pixelOffsets.before + 'px' }" />
            </div>
            <div>
                <Waveform v-if="props.audioClips.recorded" :source="props.audioClips.recorded.audioBuffer" markers
                    ref="recordingWaveform" @markerChanged="emit('markerChanged')"
                    :style="{ left: pixelOffsets.recorded + 'px' }" />
            </div>
            <div>
                <Waveform v-if="props.audioClips.after" :source="props.audioClips.after.audioBuffer"
                    ref="afterWaveform" :style="{ left: pixelOffsets.after + 'px' }" />
            </div>
        </div>
        <div ref="cursor" class="cursor" :style="{ left: pixelOffsets.cursor + pixelOffsets.starting + 'px' }"></div>
    </div>
</template>

<script setup>
import { reactive, watch, ref, onMounted, computed, nextTick } from "vue";
import Waveform from "./Waveform.vue";
import { WAVEFORM_PIXELS_PER_SECOND } from "/src/waveform.js";

const props = defineProps({
    audioClips: {
        required: true,
    },
    playing: {
        required: true,
        type: Boolean,
    },
    modelValue: {
        required: true,
        type: Number,
    },
});
const emit = defineEmits(["markerChanged", "update:modelValue"]);

const waveformContainer = ref(null);
const timeline = ref(null);
const cursor = ref(null);
const outerContainer = ref(null);

const recordingWaveform = ref(null);
const beforeWaveform = ref(null);
const afterWaveform = ref(null);

const timelineImageUrl = ref("");

const maximumWidth = computed(() => {
     let max = 0;
     if (beforeWaveform.value != null) max = Math.max(max, beforeWaveform.value.width + pixelOffsets.before);
     if (recordingWaveform.value != null) max = Math.max(max, (props.audioClips.recorded.startTime + props.audioClips.recorded.duration) * WAVEFORM_PIXELS_PER_SECOND);
     if (afterWaveform.value != null) max = Math.max(max, afterWaveform.value.width + pixelOffsets.after);
     return max;
});

const pixelOffsets = reactive({
    before: 0,
    recorded: 0,
    after: 0,
    cursor: 0,
    starting: 0,
});

onMounted(() => {
    waveformContainer.value.addEventListener("click", e => {
        const position = e.clientX - waveformContainer.value.getBoundingClientRect().left - pixelOffsets.starting;
        pixelOffsets.cursor = Math.min(Math.max(position, 0), maximumWidth.value);
        emit("update:modelValue", pixelOffsets.cursor / WAVEFORM_PIXELS_PER_SECOND);
    });
    recalculateOffsets();
});

watch(() => props.playing, () => {
    if (props.playing) {
        requestAnimationFrame(animateCursor);
    }
});

watch(props.audioClips, () => recalculateOffsets());
watch(() => props.modelValue, () => {
    pixelOffsets.cursor = props.modelValue * WAVEFORM_PIXELS_PER_SECOND;
    nextTick(() => cursor.value.scrollIntoView());
});


let lastTimestamp = null;
function animateCursor(timestamp) {
    if (props.playing) requestAnimationFrame(animateCursor);
    else {
        lastTimestamp = null;
        emit("update:modelValue", pixelOffsets.cursor / WAVEFORM_PIXELS_PER_SECOND);
        return;
    }

    if (lastTimestamp == null) {
        lastTimestamp = timestamp;
        return;
    }
    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    pixelOffsets.cursor += delta * WAVEFORM_PIXELS_PER_SECOND / 1000;
    nextTick(() => cursor.value.scrollIntoView({inline: 'center'}));
}

function recalculateOffsets() {
    pixelOffsets.starting = 0;
    const clips = [props.audioClips.before, props.audioClips.recorded, props.audioClips.after];

    for (const clip of clips) {
        if (clip != null && clip.offset > clip.startTime + pixelOffsets.starting) {
            pixelOffsets.starting = clip.offset - clip.startTime;
        }
    }
    pixelOffsets.starting *= WAVEFORM_PIXELS_PER_SECOND;

    pixelOffsets.before = (props.audioClips.before?.startTime - props.audioClips.before?.offset) * WAVEFORM_PIXELS_PER_SECOND + pixelOffsets.starting;
    pixelOffsets.recorded = (props.audioClips.recorded?.startTime - props.audioClips.recorded?.offset) * WAVEFORM_PIXELS_PER_SECOND + pixelOffsets.starting;
    pixelOffsets.after = (props.audioClips.after?.startTime - props.audioClips.after?.offset) * WAVEFORM_PIXELS_PER_SECOND + pixelOffsets.starting;
    nextTick(generateTimeline);
}

function generateTimeline() {
     const canvas = document.createElement("canvas");
     canvas.height = 20;
     canvas.width = outerContainer.value.scrollWidth;
     const ctx = canvas.getContext("2d");
     for (let x=pixelOffsets.starting; x<canvas.width; x += WAVEFORM_PIXELS_PER_SECOND) {
         ctx.fillRect(x, 0, 2, canvas.height);
     }
     const url = canvas.toDataURL("image/png");
     timelineImageUrl.value = `url(${url})`;
}

function getMarkerPos(index) {
    return recordingWaveform.value.getMarkerPos(index);
}

defineExpose({
    getMarkerPos,
})
</script>

<style scoped>
.outerContainer {
    width: min(80%, 1000px);
    overflow: auto;
    position: relative;
    margin: 0 auto;
    background: gray;
    border: 2px solid black;
    height: 50vh;
}

.waveformContainer {
    height: 100%;
    display: flex;
    gap: 1em;
    flex-direction: column;
}

.waveformContainer > div {
    flex-grow: 1;
    flex-basis: 0;
}

.cursor {
    position: absolute;
    width: 2px;
    background: black;
    height: 100%;
    top: 0;
    pointer-events: none;
}

.timeline {
    height: 20px;
    background-image: v-bind(timelineImageUrl);
}
</style>
