<template>
  <textarea
    class="short-answer"
    :disabled="reviewMode"
    :value="displayValue"
    @input="onTextInput($event.target.value)"
    rows="4"
  ></textarea>
</template>

<script setup>
import { computed } from "vue";
import { useExerciseAttemptStore } from "@/stores/exerciseAttempt";

const store = useExerciseAttemptStore();

const props = defineProps({
  question: Object,
  modelValue: {
    type: [String, Array],
  },
  reviewMode: Boolean,
});

const emit = defineEmits(["update:modelValue"]);

/**
 * Computes the displayed value of the short answer input.
 * - If reviewMode is true, retrieves the feedback response from the store.
 * - Otherwise, returns the current user input.
 */
const displayValue = computed(() => {
  if (props.reviewMode && store.feedback?.last_attempt) {
    const answer = store.feedback.last_attempt.answers.find(
      (a) => a.questionId === props.question.id
    );
    return answer?.userInput || "";
  }
  return props.modelValue?.[0] || "";
});

/**
 * Emits the updated answer value to the parent component.
 * Wraps input in an array to keep consistent format with modelValue.
 * @param {string} text - The text entered by the user
 */
function onTextInput(text) {
  emit("update:modelValue", [text]);
}
</script>

<style scoped>
.short-answer {
  width: 100%;
  font-family: inherit;
  padding: 0.75rem;
  border: 1px solid var(--vt-c-grey);
  border-radius: 6px;
  min-height: 100px;
  resize: vertical;
}

textarea {
  font-size: 15px;
}
</style>
