<template>
  <div class="short-answer-wrapper">
    <textarea
      class="answer-input"
      name="SHORT_ANSWER"
      rows="3"
      placeholder="Expected answer..."
      v-model="inputValue"
      @change="editShortAnswer"
    ></textarea>
  </div>
</template>

<script setup>
// IMPORTS
import { useExerciseEditStore } from "@/stores/exerciseEdit";
import { ref, watch } from "vue";

// PROPS
const props = defineProps({
  modelAnswer: String,
  id: String,
  slotId: String,
});

// SETUP
const currentExercise = useExerciseEditStore();
const inputValue = ref(props.modelAnswer);

watch(
  () => props.modelAnswer,
  (newVal) => {
    inputValue.value = newVal;
  }
);

// FUNCTIONS
const editShortAnswer = () => {
  currentExercise.editShortAnswer(props.slotId, props.id, inputValue.value);
};
</script>

<style scoped>
.short-answer-wrapper {
  display: flex;
  flex-direction: column;
}

.answer-input {
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.answer-input:focus {
  border-color: var(--vt-c-purple);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.tag-item {
  display: flex;
  align-items: center;
}

.tag {
  display: inline-flex;
  align-items: center;
  border-radius: 7px;
  padding: 2px 6px;
  font-size: 0.8rem;
  background-color: var(--vt-c-grey-light);
  color: var(--vt-c-grey-dark);
  border: 2px solid var(--vt-c-grey);
}

.tag-text {
  margin-right: 6px;
  display: flex;
  align-items: center;
}

button {
  cursor: pointer;
  padding: 0;
  border: none;
  outline: none;
  color: var(--vt-c-grey-dark);
}

.delete-icon {
  color: var(--vt-c-grey-dark);
  font-size: 0.8rem;
}
</style>
