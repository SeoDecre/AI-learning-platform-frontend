<template>
  <div class="true-false-options">
    <label class="radio-label">
      <input
        type="radio"
        :name="'question-' + question.id"
        value="true"
        :checked="displayValue === true"
        :disabled="reviewMode"
        @change="$emit('update:modelValue', true)"
        class="custom-radio"
        :class="{
          'correct-answer':
            reviewMode &&
            displayValue === true &&
            question.correctAnswer === true,
          'wrong-answer':
            reviewMode &&
            displayValue === true &&
            question.correctAnswer === false,
        }"
      />
      <span class="radio-text">True</span>
    </label>
    <label class="radio-label">
      <input
        type="radio"
        :name="'question-' + question.id"
        value="false"
        :checked="displayValue === false"
        :disabled="reviewMode"
        @change="$emit('update:modelValue', false)"
        class="custom-radio"
        :class="{
          'correct-answer':
            reviewMode &&
            displayValue === false &&
            question.correctAnswer === false,
          'wrong-answer':
            reviewMode &&
            displayValue === false &&
            question.correctAnswer === true,
        }"
      />
      <span class="radio-text">False</span>
    </label>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useExerciseAttemptStore } from "@/stores/exerciseAttempt";

const store = useExerciseAttemptStore();

const props = defineProps({
  question: Object,
  modelValue: Boolean,
  reviewMode: Boolean,
});

/**
 * Computes the displayed value of the true/false answer.
 * - In read-only mode, fetches the answer from the feedback (last attempt).
 * - Otherwise, returns the current bound value (modelValue).
 */
const displayValue = computed(() => {
  if (props.reviewMode && store.feedback?.last_attempt) {
    const answer = store.feedback.last_attempt.answers.find(
      (a) => a.questionId === props.question.id
    );
    return answer?.answer ?? null;
  }
  return props.modelValue;
});
</script>

<style scoped>
/* Container for the two options */
.true-false-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 1rem;
}

/* Label layout */
.radio-label {
  display: flex;
  align-items: center;
}

/* Hide default browser radio styles */
.custom-radio {
  appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid color-mix(in srgb, var(--vt-c-grey), black 20%);
  border-radius: 50%;
  position: relative;
  margin-right: 0.5rem;
  cursor: pointer;
  vertical-align: middle;
}

/* Inner dot: gray by default, hidden */
.custom-radio::before {
  content: "";
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: color-mix(in srgb, var(--vt-c-grey), black 20%);
  position: absolute;
  top: 2px;
  left: 2px;
  opacity: 0;
  transition: opacity 0.2s ease, background-color 0.2s ease;
}

/* When checked: show black dot */
.custom-radio:checked::before {
  background-color: var(--vt-c-grey-dark);
  opacity: 1;
}

/* Text next to the radio button */
.radio-text {
  font-size: 1rem;
}

.correct-answer {
  border-color: var(--vt-c-green) !important;
}

.correct-answer:checked::before {
  background-color: var(--vt-c-green) !important;
  border-color: var(--vt-c-green) !important;
}

.wrong-answer {
  border-color: var(--vt-c-red) !important;
}

.wrong-answer:checked::before {
  background-color: var(--vt-c-red) !important;
  border-color: var(--vt-c-red) !important;
}
</style>
