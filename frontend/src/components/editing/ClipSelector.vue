<template>
    <dialog ref="dialog">
        <h1>
            Vyber zvukový klip
        </h1>
        <input ref="input" accept="audio/*" type="file">
        <button @click="confirm">Ok</button>
        <button @click="dialog.close()">Zrušiť</button>
    </dialog>
</template>

<script setup>
import { ref } from "vue";

const dialog = ref(null);
const input = ref(null);

const emit = defineEmits(["fileChanged"]);

function open() {
    dialog.value.showModal();
}

function confirm() {
    emit("fileChanged", input.value.files[0]);
    dialog.value.close();
}

defineExpose({
    open,
});
</script>

<style>
</style>
