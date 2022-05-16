<template>
    <div class="waveformDiv">

        <canvas ref="canvas" width="500" height="100"></canvas>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";

const props = defineProps({
    source: {
        type: ArrayBuffer,
        required: true,
    },
})

const SAMPLE_SIZE = 512;
const FOREGROUND = "rgb(50, 50, 200)";
const canvas = ref(null);
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

        })
        .catch(e => {
            console.error("Couldn't decode audio data: ", e);
        });
});
</script>

<style>
 .waveformDiv {
     background-color: lightgray;
     width: max-content;
 }

 canvas {
     display: block;
 }

</style>
