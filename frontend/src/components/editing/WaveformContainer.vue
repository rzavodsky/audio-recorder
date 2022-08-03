<template>
    <div class="outerContainer" ref="outerContainer">
        <div>
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
            <div ref="cursor" class="cursor" :style="{ left: pixelOffsets.cursor + pixelOffsets.starting + 'px' }" />
        </div>
    </div>
</template>

<script setup>
import { reactive, watch, ref, onMounted, computed, nextTick } from "vue";
import Waveform from "./Waveform.vue";
import { WAVEFORM_PIXELS_PER_SECOND } from "/src/waveform.js";

const TIMELINE_HEIGHT = 20;

const props = defineProps({
    audioClips: {
        required: true,
    },
    playing: {
        required: true,
        type: Boolean,
    },
});
const emit = defineEmits(["markerChanged", "cursorUpdated"]);

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
    for (const clip of Object.values(props.audioClips)) {
        if (clip != null) {
            max = Math.max(max, clip.startTime + clip.duration);
        }
    }
    return max * WAVEFORM_PIXELS_PER_SECOND;
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
        emit("cursorUpdated", pixelOffsets.cursor / WAVEFORM_PIXELS_PER_SECOND);
    });

    recalculateOffsets();
});

watch(() => props.playing, () => {
    if (props.playing) {
        requestAnimationFrame(animateCursor);
    }
});

watch(props.audioClips, () => recalculateOffsets());

function setCursorPos(cursorPos) {
    pixelOffsets.cursor = cursorPos * WAVEFORM_PIXELS_PER_SECOND;
    nextTick(() => cursor.value.scrollIntoView());
}

let lastTimestamp = null;
function animateCursor(timestamp) {
    if (props.playing) requestAnimationFrame(animateCursor);
    else {
        lastTimestamp = null;
        emit("cursorUpdated", pixelOffsets.cursor / WAVEFORM_PIXELS_PER_SECOND);
        return;
    }

    if (lastTimestamp == null) {
        lastTimestamp = timestamp;
        return;
    }
    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    pixelOffsets.cursor += delta * WAVEFORM_PIXELS_PER_SECOND / 1000;
    nextTick(() => cursor.value.scrollIntoView({ inline: 'center' }));
}

function recalculateOffsets() {
    pixelOffsets.starting = 0;

    for (const clip of Object.values(props.audioClips)) {
        if (clip != null && clip.offset > clip.startTime + pixelOffsets.starting) {
            pixelOffsets.starting = clip.offset - clip.startTime;
        }
    }
    pixelOffsets.starting *= WAVEFORM_PIXELS_PER_SECOND;

    for (const clipName in props.audioClips) {
        const clip = props.audioClips[clipName];
        if (clip != null) {
            pixelOffsets[clipName] = (clip.startTime - clip.offset) * WAVEFORM_PIXELS_PER_SECOND + pixelOffsets.starting;
        }
    }
    nextTick(generateTimeline);
}

function generateTimeline() {
    const canvas = document.createElement("canvas");
    canvas.height = TIMELINE_HEIGHT;
    canvas.width = timeline.value.clientWidth;
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "middle";
    let s = 0.0;
    for (let x = pixelOffsets.starting; x < canvas.width; x += WAVEFORM_PIXELS_PER_SECOND / 2) {
        if (Number.isInteger(s)) {
            ctx.fillRect(x, 0, 2, canvas.height);
            const numberText = s.toFixed(1);
            if (ctx.measureText(numberText).width + x < canvas.width) { // Draw text only if it fits
                ctx.fillText(numberText, x + 4, canvas.height / 2);
            }
        } else {
            ctx.fillRect(x, 0, 1, canvas.height * 0.6);
        }
        s += 0.5;
    }
    const url = canvas.toDataURL("image/png");
    timelineImageUrl.value = `url(${url})`;
}

function getMarkerPos(index) {
    return recordingWaveform.value.getMarkerPos(index);
}

defineExpose({
    getMarkerPos,
    setCursorPos,
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

.outerContainer>div {
    height: 100%;
    width: v-bind(maximumWidth + pixelOffsets.starting + 'px');
}

.waveformContainer {
    height: calc(100% - v-bind(TIMELINE_HEIGHT + 'px'));
    display: flex;
    gap: 1em;
    flex-direction: column;
}

.waveformContainer>div {
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
