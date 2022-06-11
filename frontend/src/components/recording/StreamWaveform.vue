<template>
    <div class="rec-waveform">
        <canvas ref="canvas" :width="props.width" :height="props.height"></canvas>
        <div class="cursor"></div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { drawWaveform } from "/src/waveform.js";

const props = defineProps(["width", "height"]);
const foreground = "rgb(50, 50, 200)";

const cursorPos = ref(0);
const canvas    = ref(null);

let data = [];
let lastDataLength = 0;
let shouldDraw = false;
let audioCtx = null;
let canvasCtx = null;

onMounted(() => {
    canvasCtx = canvas.value.getContext("2d");
})

function recordFromStream(stream) {
    audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    audioCtx.audioWorklet.addModule("src/waveform-sampler.js")
        .then(() => {
            const sampler = new AudioWorkletNode(audioCtx, 'waveform-sampler');
            source.connect(sampler);

            sampler.port.onmessage = msg => {
                data.push(msg.data);
            }

            shouldDraw = true;
            render();
        })
}

function stop() {
    shouldDraw = false;
    audioCtx.close();
}

function render() {
    // Resize canvas if necessary, then redraw entire waveform, otherwise just draw new data
    if (data.length > canvas.value.width) {
        canvas.value.width = Math.ceil(data.length / props.width) * props.width;
        drawWaveform(canvas.value, canvasCtx, data);
    } else {
        drawWaveform(canvas.value, canvasCtx, data, lastDataLength);
    }
    lastDataLength = data.length;
    cursorPos.value = data.length;

    if (shouldDraw) {
        requestAnimationFrame(render);
    }
}

defineExpose({
    recordFromStream,
    stop,
});

</script>

<style>
 .rec-waveform {
     position: relative;
     width: max-content;
     background-color: lightgrey;
 }

 .rec-waveform .cursor {
     position: absolute;
     width: 2px;
     top: 0;
     left: v-bind(cursorPos + 'px');
     background-color: black;
     height: 100%;
 }
</style>
