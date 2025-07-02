<template>
  <div class="question-card" :id="question.id">
    <div class="question-content">
      <form @submit.prevent>
        <div class="form-group title-group">
          <!-- Title input -->
          <input
            type="text"
            id="title"
            name="title"
            v-model="question.title"
            placeholder="Title"
            @blur="handleInfoChange"
            class="title-input"
          />
        </div>

        <div class="form-group">
          <textarea
            id="description"
            name="description"
            v-model="question.description"
            placeholder="Description"
            @input="autoResize"
            @blur="handleInfoChange"
            class="description-input"
            rows="1"
            ref="descriptionRef"
          />
        </div>

        <!-- Question type components -->
        <MultiChoice
          v-if="question.type === 'MULTI_CHOICE'"
          :slotId="slotId"
          :id="question.id"
          :correctIndexes="question.correctIndexes"
          :options="question.options"
        />

        <TrueFalse
          v-if="question.type === 'TRUE_FALSE'"
          :slotId="slotId"
          :id="question.id"
          :correctAnswer="question.correctAnswer"
        />

        <ShortAnswer
          v-if="question.type === 'SHORT_ANSWER'"
          :slotId="slotId"
          :modelAnswer="question.modelAnswer"
          :id="question.id"
        />

        <XIcon class="delete-button" @click="deleteSelf" />
      </form>
    </div>
  </div>
</template>

<script setup>
// IMPORTS
import MultiChoice from "./MultiChoice.vue";
import ShortAnswer from "./ShortAnswer.vue";
import { useExerciseEditStore } from "@/stores/exerciseEdit";
import TrueFalse from "./TrueFalse.vue";
import XIcon from "./icons/XIcon.vue";
import { ref, watch, onMounted, nextTick } from "vue";

const currentExercise = useExerciseEditStore();

// PROPS
const props = defineProps({
  slotId: String,
  question: Object,
});

// SETUP
let originalTitle = props.question.title;
let originalDescription = props.question.description;
const descriptionRef = ref(null);

const autoResize = () => {
  const el = descriptionRef.value;
  if (el) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }
};

onMounted(() => {
  nextTick(() => autoResize());
});

/**
 * Handle changes to question title and description
 * Validates that neither field is empty
 */
const handleInfoChange = () => {
  if (
    originalTitle !== props.question.title ||
    originalDescription !== props.question.description
  ) {
    originalTitle = props.question.title;
    originalDescription = props.question.description;
    currentExercise.setDirty();
  }
};

const deleteSelf = () => {
  currentExercise.deleteVariant(props.slotId, props.question.id);
};
</script>

<style scoped>
.delete-button {
  position: absolute;
  cursor: pointer;
  width: 30px;
  right: 10px;
  color: var(--vt-c-purple-dark);
}

.question-card {
  display: flex;
  gap: 1rem;
  width: 100%;
  position: relative;
}

.question-content {
  flex: 1;
  width: 100%;
}

form {
  background-color: color-mix(in srgb, var(--vt-c-purple), white 85%);
  border: 2px solid color-mix(in srgb, var(--vt-c-purple), white 75%);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.title-group {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.title-input {
  font-size: 1.25rem;
  font-weight: bold;
  border: none;
  background-color: transparent;
  width: 100%;
  transition: border-color 0.2s ease;
}

.title-input:focus {
  outline: none;
}

.description-input {
  border: none;
  border-bottom: 2px solid color-mix(in srgb, var(--vt-c-purple), white 75%);
  font-size: 1rem;
  resize: vertical;
  background-color: transparent;
  width: 100%;
  line-height: 1.4;
  font-family: "Circular";
  font-weight: lighter;
  transition: all 0.2s ease;
  overflow: hidden;
}

.description-input:focus {
  outline: none;
  border-bottom-color: var(--vt-c-purple-light);
}

input[type="text"] {
  width: 100%;
  background-color: transparent;
  transition: border-color 0.2s ease;
}

input[type="text"]:focus {
  outline: none;
  border-bottom-color: var(--vt-c-purple-light);
}
</style>
