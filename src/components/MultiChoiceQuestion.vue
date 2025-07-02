<template>
  <div class="choices">
    <label v-for="(option, idx) in question.options" :key="idx" class="choice">
      <div class="custom-checkbox">
        <input
          type="checkbox"
          :value="idx"
          v-model="selectedOptions"
          :disabled="reviewMode"
          class="original-checkbox"
        />
        <span
          class="checkmark"
          :class="{
            correct: reviewMode && isSelectedCorrect(idx),
            wrong: reviewMode && isSelectedWrong(idx),
          }"
        ></span>
      </div>
      {{ option }}
    </label>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useExerciseAttemptStore } from "@/stores/exerciseAttempt";

const store = useExerciseAttemptStore();

const props = defineProps({
  question: Object,
  modelValue: Array,
  reviewMode: Boolean,
});

/**
 * Retrieves the list of selected option indexes from the user's last attempt,
 * used when the component is review mode.
 *
 * @returns {Array} - Array of selected option indexes.
 */
const lastAttemptAnswer = computed(() => {
  if (!props.reviewMode || !store.feedback?.last_attempt) return null;
  const answer = store.feedback.last_attempt.answers.find(
    (a) => a.questionId === props.question.id
  );
  return answer?.selectedIndexes || [];
});

/**
 * Computed property that handles both modes:
 * - review mode: returns the last attempt answers (reviewMode)
 * - attempt mode: provides two-way binding with the parent component
 */
const selectedOptions = computed({
  get() {
    // in review mode, return the answers from last attempt (if available)
    if (props.reviewMode && lastAttemptAnswer.value) {
      return lastAttemptAnswer.value;
    }
    // in attempt mode, return the current selected options from parent
    return props.modelValue || [];
  },
  set(newValue) {
    // in review mode, ignore any changes
    if (props.reviewMode) return;
    // In attempt mode, emit the updated selection to parent component
    emit("update:modelValue", newValue);
  },
});

const emit = defineEmits(["update:modelValue"]);

/**
 * Determines whether a given option index is both selected by the user
 * and is a correct answer.
 *
 * @param idx - Index of the option to check
 * @returns - True if the option is selected and correct, false otherwise
 */
const isSelectedCorrect = (idx) => {
  return (
    selectedOptions.value.includes(idx) &&
    props.question.correctIndexes.includes(idx)
  );
};

/**
 * Determines whether a given option index is selected by the user
 * and is an incorrect answer.
 *
 * @param idx - Index of the option to check
 * @returns - True if the option is selected and incorrect, false otherwise
 */
const isSelectedWrong = (idx) => {
  return (
    selectedOptions.value.includes(idx) &&
    !props.question.correctIndexes.includes(idx)
  );
};
</script>

<style scoped>
.choices {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.choice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Custom checkbox styling */
.custom-checkbox {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

/* Hide the original checkbox */
.original-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

/* Create custom checkbox design */
.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  background-color: var(--vt-c-grey-light);
  border: 2px solid var(--vt-c-grey);
  border-radius: 4px;
  transition: all 0.2s ease;
}

/* When hovering over the checkbox */
.custom-checkbox:hover .checkmark {
  background-color: var(--vt-c-grey);
}

/* When the checkbox is checked */
.original-checkbox:checked ~ .checkmark {
  background-color: var(--vt-c-purple);
  border-color: var(--vt-c-purple);
}

/* Create the checkmark/indicator (hidden when not checked) */
.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

/* Show the checkmark when checked */
.original-checkbox:checked ~ .checkmark:after {
  display: block;
}

/* Style the checkmark/indicator */
.custom-checkbox .checkmark:after {
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid var(--vt-c-purple-dark);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Correct answer styling (green checkmark) */
.checkmark.correct {
  background-color: var(--vt-c-green) !important;
  border-color: var(--vt-c-green) !important;
}

.checkmark.correct:after {
  border-color: var(--vt-c-white) !important;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Wrong answer styling (red with white X) */
.checkmark.wrong {
  background-color: var(--vt-c-red) !important;
  border-color: var(--vt-c-red) !important;
}

.checkmark.wrong:after {
  content: "✕";
  color: var(--vt-c-white);
  font-size: 14px;
  font-weight: bold;
  line-height: 18px;
  text-align: center;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  border: none;
  transform: none;
}
</style>
