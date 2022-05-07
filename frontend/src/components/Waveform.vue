<template>
    <div class="waveform" ref="canvasDiv">
        <canvas ref="canvas" :width="props.width" height=100></canvas>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const background = "rgb(192, 192, 192)";
const foreground = "rgb(50, 50, 200)";
const fftSize = 512;

const props = defineProps({
    width: {
        type: Number,
        default: 500,
    },
});

const canvas = ref(null);
const canvasDiv = ref(null);

let canvasCtx = null;
let analyser = null;
let byteArray = new Float32Array(fftSize);

let data = [];


onMounted(() => {
    canvasCtx = canvas.value.getContext("2d");
    render();
})

function setStream(stream) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.smoothingTimeConstant = 0;
    analyser.fftSize = fftSize;
    source.connect(analyser);
}

let interval = null;
function record() {
    data = [];
    canvas.value.width = props.width;
    interval = setInterval(() => {
        analyser.getFloatTimeDomainData(byteArray);
        let newVolume = byteArray.reduce((prev, curr) => Math.max(prev, Math.abs(curr)), 0);
        data.push(newVolume);
    }, 10);
}

function stop() {
    clearInterval(interval);
}

let lastDataLength = 0;
function render() {
    // Resize canvas if necessary, then redraw entire waveform, otherwise just draw new data
    if (data.length > canvas.value.width) {
        canvas.value.width = Math.ceil(data.length / props.width) * props.width;
        drawWaveform(0);
        canvasDiv.value.scroll({
            top: 0,
            left: canvasDiv.value.scrollWidth,
            behavior: 'instant',
        });
    } else {
        drawWaveform(lastDataLength);
    }
    lastDataLength = data.length;

    requestAnimationFrame(render);
}

function drawWaveform(startAt) {
    canvasCtx.fillStyle = background;
    canvasCtx.fillRect(startAt, 0, canvas.value.width - startAt, canvas.value.height);

    canvasCtx.fillStyle = foreground;
    // Move origin of y axis to the center of the canvas
    canvasCtx.translate(0, canvas.value.height/2);

    for (let x = startAt; x < data.length; x++) {
        let y = data[x] * canvas.value.height/2 + 1;
        canvasCtx.fillRect(x, -y, 1, 2*y);
    }

    // Reset transform
    canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
}

defineExpose({
    record,
    stop,
    setStream
})
</script>

<style>
 .waveform {
     overflow-x: auto;
     width: v-bind('props.width + "px"');
 }
</style>
