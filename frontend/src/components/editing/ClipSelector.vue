<template>
    <dialog ref="dialog">
        <h1>{{props.title}}</h1>
        <label for="clips">Vyber zvukový klip:</label>
        <select v-if="clips != null" ref="select" id="clips">
            <option selected value="">Žiaden</option>
            <option v-for="clip in clips" :value="clip">{{ clip }}</option>
        </select>
        <div v-else>
            Loading...
        </div>
        <button @click="confirm">Ok</button>
        <button @click="dialog.close()">Zrušiť</button>
    </dialog>
</template>

<script setup>
import { ref, onMounted } from "vue";

const dialog = ref(null);
const select = ref(null);
const clips = ref(null);

const emit = defineEmits(["selected"]);
const props = defineProps(["title"]);

onMounted(() => {
    fetch("/api/clips")
        .then(res => res.json())
        .then(res => {
            clips.value = res.clips;
        });
});

function open() {
    dialog.value.showModal();
}

function confirm() {
    const clipName = select.value.selectedOptions[0].value;
    if (clipName === "") {
        emit("selected", null, null);
        dialog.value.close();
    } else {
        fetch(`/api/clip/${clipName}`)
            .then(res => res.blob())
            .then(blob => {
                emit("selected", blob, clipName);
                dialog.value.close();
            });
    }
}

defineExpose({
    open,
});
</script>

<style>
</style>
