<template>
    <div class="waveformDiv">
        <canvas ref="canvas" width="500" height="100"></canvas>
        <div v-if="markers != null" class="markers">
            <div class="marker left"  :style="{width: markers[0] + 'px'}">
                <div ref="handleLeft" class="handle left"></div>
            </div>
            <div class="marker right" :style="{left: markers[1] + 'px'}">
                <div ref="handleRight" class="handle right"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";

const props = defineProps({
    source: {
        type: ArrayBuffer,
        required: true,
    },
    markers: Boolean,
})

const SAMPLE_SIZE = 512;
const FOREGROUND = "rgb(50, 50, 200)";
const canvas = ref(null);
const markers = ref(null);
const handleLeft = ref(null);
const handleRight = ref(null);

onMounted(() => {
    const canvasCtx = canvas.value.getContext("2d");
    const audioCtx = new AudioContext();
    audioCtx.decodeAudioData(props.source)
        .then(audioBuffer => {
            const array = audioBuffer.getChannelData(0);
            canvas.value.width = Math.floor(array.length / SAMPLE_SIZE);
            let max = 0;

            canvasCtx.fillStyle = FOREGROUND;
            canvasCtx.translate(0, canvas.value.height/2);

            for (let i=0; i<array.length; i++) {
                max = Math.max(array[i], max);
                if ((i+1) % SAMPLE_SIZE === 0) {
                    const y = max * canvas.value.height/2 + 1;
                    const x = Math.floor(i / SAMPLE_SIZE);
                    canvasCtx.fillRect(x, -y, 1, 2*y);
                    max = 0;
                }
            }

            if (props.markers) {
                markers.value = [20, canvas.value.width - 20];
            }
        })
        .catch(e => {
            console.error("Couldn't decode audio data: ", e);
        });
});

watch(handleRight, newHandle => {
    let dragging = false;
    const start = () => dragging = true;
    const stop = () => dragging = false;
    newHandle.onpointerdown = start;
    newHandle.onpointerup = stop;
    canvas.value.onpointerup = stop;
    canvas.value.onpointerout = e => {
        if (e.relatedTarget !== newHandle) {
            stop();
        }
    };

    newHandle.onpointermove = e => {
        if (dragging) {
            const offsetX = e.clientX - canvas.value.getBoundingClientRect().x;
            markers.value[1] = offsetX;
        }
    }
    canvas.value.onpointermove = e => {
        if (dragging) {
            markers.value[1] = e.offsetX;
        }
    }
});

watch(handleLeft, newHandle => {
    let dragging = false;
    const start = () => dragging = true;
    const stop = () => dragging = false;
    newHandle.onpointerdown = start;
    newHandle.onpointerup = stop;
    canvas.value.addEventListener("pointerup", stop);
    canvas.value.addEventListener("pointerout", e => {
        if (e.relatedTarget !== newHandle) {
            stop();
        }
    });

    newHandle.onpointermove = e => {
        if (dragging) {
            const offsetX = e.clientX - canvas.value.getBoundingClientRect().x;
            markers.value[0] = offsetX;
        }
    }
    canvas.value.addEventListener("pointermove", e => {
        if (dragging) {
            markers.value[0] = e.offsetX;
        }
    });
});

</script>

<style>
 .waveformDiv {
     background-color: lightgray;
     width: max-content;
     position: relative;
     overflow: hidden;
 }

 canvas {
     display: block;
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
     pointer-events: none;
 }

 .handle {
     width: .75em;
     height: 1em;
     border-radius: 3px;
     background: var(--marker-color);
     position: absolute;
     top: 50%;
     transform: translate(-50%, -50%);
     pointer-events: auto;
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
