<template>
  <form
    v-if="props.material"
    class="edit-material-form"
    @submit.prevent="handleSubmit"
  >
    <h2>Edit {{ props.material.type }} Material</h2>
    <div class="field">
      <label for="title">Title:</label>
      <input id="title" v-model="inputTitle" required />
    </div>

    <div v-if="props.material.type === 'Link'" class="field">
      <label for="url">URL:</label>
      <input id="url" type="url" v-model="inputContent" required />
    </div>

    <div v-else-if="props.material.type === 'Markdown'" class="field">
      <label for="markdown">Markdown:</label>
      <textarea id="markdown" v-model="inputContent" rows="6" required />
    </div>

    <div v-else class="field">
      <label for="file">Replace File:</label>
      <input id="file" type="file" @change="onFileChange" />
    </div>

    <div class="field checkbox-field">
      <input id="draft" type="checkbox" v-model="draftStatus" />
      <label for="draft">Draft</label>
    </div>

    <div class="actions">
      <button type="submit" class="btn save">Save</button>
      <button type="button" class="btn cancel" @click="emit('close')">
        Cancel
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useMaterialStore } from "@/stores/Material";

const props = defineProps({
  material: { type: Object, required: true },
  topicId: { type: String, required: true },
});
const emit = defineEmits(["close"]);

const store = useMaterialStore();
const inputTitle = ref("");
const inputContent = ref("");
let inputFile = null;

const draftStatus = ref(props.material.isDraft);

watch(
  () => props.material.isDraft,
  (val) => {
    draftStatus.value = val;
  }
);

const isFileType = computed(
  () => props.material.type === "PDF" || props.material.type === "File"
);

watch(
  () => props.material,
  (mat) => {
    if (mat) {
      inputTitle.value = mat.title;
      inputContent.value = mat.content || "";
      inputFile = null;
      draftStatus.value = mat.isDraft;
    }
  },
  { immediate: true }
);

const onFileChange = (e) => {
  inputFile = e.target.files[0] || null;
};

const handleSubmit = async () => {
  try {
    // build update DTO including draft status
    const baseDto = {
      title: inputTitle.value,
      content: inputContent.value,
      isDraft: draftStatus.value,
    };
    const updateDto = isFileType.value
      ? { ...baseDto, type: props.material.type }
      : baseDto;

    const updated = await store.updateMaterial(
      props.material.id,
      updateDto,
      isFileType.value ? inputFile : null
    );

    if (updated) {
      // emit close so parent can refresh
      emit("close");
    }
  } catch (err) {
    console.error("Error updating material:", err);
  }
};
</script>

<style scoped>
.edit-material-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  color: var(--vt-c-black);
}
.field {
  display: flex;
  flex-direction: column;
}
.checkbox-field {
  flex-direction: row;
  align-items: center;
}
.field label {
  margin-bottom: 0.5rem;
  font-weight: bold;
}
.field input[type="text"],
.field select,
.field textarea {
  padding: 0.5rem;
  border: 1px solid var(--vt-c-divider-light);
  border-radius: 4px;
  width: 100%;
}
.actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn.save {
  background-color: var(--vt-c-purple);
  color: white;
}
.btn.cancel {
  background-color: var(--vt-c-grey-light);
}
</style>
