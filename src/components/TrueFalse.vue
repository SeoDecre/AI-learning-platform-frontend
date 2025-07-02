<template>
  <div class="true-false-options">
    <!-- TRUE option -->
    <label class="radio-label">
      <!-- Custom-styled radio input -->
      <input
        type="radio"
        name="TRUE_FALSE"
        value="TRUE"
        v-model="selectedAnswer"
        @change="handleChange('TRUE')"
        class="custom-radio"
      />
      <span class="radio-text">True</span>
    </label>

    <!-- FALSE option -->
    <label class="radio-label">
      <!-- Custom-styled radio input -->
      <input
        type="radio"
        name="TRUE_FALSE"
        value="FALSE"
        v-model="selectedAnswer"
        @change="handleChange('FALSE')"
        class="custom-radio"
      />
      <span class="radio-text">False</span>
    </label>
  </div>
</template>

<script setup>
// IMPORTS
import { ref, watch } from "vue";
import { useExerciseEditStore } from "@/stores/exerciseEdit";

// PROPS
const props = defineProps({
  slotId: String,
  id: {
    type: String,
    required: true,
  },
  correctAnswer: {
    type: Boolean,
    required: true,
  },
});

// STORE ACCESS
const currentExercise = useExerciseEditStore();

// Convert Boolean correctAnswer into a string ("TRUE"/"FALSE") for v-model binding
const selectedAnswer = ref(props.correctAnswer ? "TRUE" : "FALSE");

watch(
  () => props.correctAnswer,
  (newAnswer) => {
    selectedAnswer.value = newAnswer ? "TRUE" : "FALSE";
  }
);

/**
 * Handle user changing the selected answer.
 * Triggers a store update only if the value is different.
 */
const handleChange = (newVal) => {
  const newBool = newVal === "TRUE";
  if (newBool !== props.correctAnswer) {
    currentExercise.editTrueFalse(props.slotId, props.id);
  }
};

// If props.correctAnswer changes externally, sync the radio selection
watch(
  () => props.correctAnswer,
  (newVal) => {
    selectedAnswer.value = newVal ? "TRUE" : "FALSE";
  }
);
</script>

<style scoped>
/* Container for the two options */
.true-false-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 1rem;
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

/* Label layout */
.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

/* Text next to the radio button */
.radio-text {
  font-size: 1rem;
}
</style>
