<template>
    <div class="waveformDiv" ref="waveformDiv">
        <div v-if="markers != null" class="markers">
            <div class="marker left" :style="{ width: markers[0] + 'px' }">
                <div ref="handleLeft" class="handle left"></div>
            </div>
            <div class="marker right" :style="{ left: markers[1] + 'px' }">
                <div ref="handleRight" class="handle right"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { WAVEFORM_PIXELS_PER_SECOND, drawWaveform } from "/src/waveform.js";

const props = defineProps({
    source: {
        type: AudioBuffer,
        required: true,
    },
    markers: Boolean,
})

const emit = defineEmits(["markerChanged"]);

const markers = ref(null);
const handleLeft = ref(null);
const handleRight = ref(null);
const canvasImgUrl = ref(null);
const waveformDiv = ref(null);
const imageWidth = ref(0);

onMounted(() => {
    generateWaveform();
    if (props.markers) {
        markers.value = [20, (props.source.duration * WAVEFORM_PIXELS_PER_SECOND) - 20];
    }
});

function generateWaveform() {
    let waveformData = [];
    const canvas = document.createElement("canvas");
    const canvasCtx = canvas.getContext("2d");

    const array = props.source.getChannelData(0);
    canvas.width = Math.floor(props.source.duration * WAVEFORM_PIXELS_PER_SECOND);
    canvas.height = 300;
    const sampleSize = Math.round(props.source.sampleRate / WAVEFORM_PIXELS_PER_SECOND);
    let max = 0;

    for (let i = 0; i < array.length; i++) {
        max = Math.max(array[i], max);
        if ((i + 1) % sampleSize === 0) {
            waveformData.push(max);
            max = 0;
        }
    }
    drawWaveform(canvas, canvasCtx, waveformData);
    const url = canvas.toDataURL("image/png");
    canvasImgUrl.value = `url(${url})`;
    imageWidth.value = canvas.width;
}

function setupHandle(handle, index) {
    let dragging = false;

    handle.addEventListener("pointerdown", () => dragging = true);
    document.addEventListener("pointerup", () => {
        if (dragging) {
            dragging = false;
            emit("markerChanged");
        }
    });
    document.addEventListener("pointermove", e => {
        if (dragging) {
            const position = e.clientX - waveformDiv.value.getBoundingClientRect().x;

            const min = index > 0 ? markers.value[index - 1] : 0;
            const max = index < markers.value.length - 1 ? markers.value[index + 1] : waveformDiv.value.clientWidth;

            markers.value[index] = Math.min(Math.max(position, min), max);
        }
    });
}

watch(() => props.source, generateWaveform);

watch(handleLeft, newHandle => setupHandle(newHandle, 0));
watch(handleRight, newHandle => setupHandle(newHandle, 1));

function getMarkerPos(index) {
    if (markers.value == null) return null;
    return markers.value[index] / WAVEFORM_PIXELS_PER_SECOND;
}

defineExpose({
    getMarkerPos,
    width: imageWidth,
});

</script>

<style>
.waveformDiv {
    width: v-bind(imageWidth + 'px');
    background-color: lightgray;
    position: relative;
    overflow: hidden;
    height: 100%;
    background-image: v-bind(canvasImgUrl);
    background-size: 100% 100%;
}

.marker {
    --marker-width: 2px;
    --marker-color: black;
    --border: var(--marker-width) solid var(--marker-color);
    box-sizing: border-box;
    position: absolute;
    top: 0;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
}

.handle {
    width: .75em;
    height: 1em;
    border-radius: 3px;
    background: var(--marker-color);
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    touch-action: none;
    cursor: grab;
}

.handle:active {
    cursor: grabbing;
}

.handle.left {
    left: calc(100% + var(--marker-width)/2);
}

.handle.right {
    left: calc(0px - var(--marker-width)/2);
}

.marker.left {
    border-right: var(--border);
    left: 0;
}

.marker.right {
    border-left: var(--border);
    width: 100%;
}
</style>
