<template>
  <div class="multi-choice-wrapper">
    <div
      class="option-item"
      v-for="(option, index) in props.options"
      :key="index"
    >
      <label class="custom-checkbox">
        <input
          type="checkbox"
          :name="option"
          :value="index"
          v-model="correctOpts"
          @click="() => SetAnswer(index)"
          class="original-checkbox"
        />
        <span class="checkmark"></span>
      </label>
      <input
        type="text"
        ref="input"
        :id="`input-${index}`"
        :name="option"
        :value="option"
        @blur="(newOption) => changeOption(newOption.target.value, option)"
        @keyup.enter="
          (newOption) => changeOption(newOption.target.value, option)
        "
        class="option-input"
      />
      <XIcon
        class="delete-icon"
        @click="() => deleteMultiChoiceOption(option)"
      />
    </div>
    <AddIcon class="add-icon" @click="AddMultiChoiceOption" />
  </div>
</template>

<script setup>
// IMPORTS
import { ref, watch } from "vue";
import { useExerciseEditStore } from "@/stores/exerciseEdit";
import XIcon from "./icons/XIcon.vue";
import AddIcon from "./icons/AddIcon.vue";
const currentExercise = useExerciseEditStore();

// PROPS
const props = defineProps({
  options: Array,
  correctIndexes: Array,
  id: String,
  slotId: String,
});

// used for rendering
const correctOpts = ref(props.correctIndexes);

watch(
  () => props.correctIndexes,
  (newIndexes) => {
    correctOpts.value = newIndexes;
  }
);

// FUNCTIONS

/**
 * adds a new empty multichoice option
 */
const AddMultiChoiceOption = () => {
  for (const option of props.options) {
    if (option === "") {
      window.alert("Don't create multiple empty options!");
      return;
    }
  }
  currentExercise.addOption(props.slotId, props.id);
};

/**
 * changes the value of a specific option
 * @param newOption new value of option
 * @param oldOption old value of option
 */
const changeOption = (newOption, oldOption) => {
  currentExercise.changeOption(props.slotId, props.id, oldOption, newOption);
};

/**
 * deletes a specific option
 * @param option option to be deleted
 */
const deleteMultiChoiceOption = (option) => {
  currentExercise.deleteOption(props.slotId, props.id, option);
};

/**
 * sets an index as answer or removes it from set of accepted answers
 * @param option option to be set as correct answer
 */
const SetAnswer = (index) => {
  currentExercise.setCorrectOption(props.slotId, props.id, index);
};
</script>

<style scoped>
.multi-choice-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.option-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

input {
  font-weight: lighter;
  font-family: "Circular";
}

.option-input {
  flex-grow: 1;
  border: none;
  border-radius: 10px;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.option-input:focus {
  border-color: var(--vt-c-purple);
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
  background-color: var(--vt-c-white);
  border: 2px solid color-mix(in srgb, var(--vt-c-purple), white 70%);
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

.delete-icon, .add-icon {
  color: var(--vt-c-purple-dark);
  cursor: pointer;
}

.add-option-button {
  cursor: pointer;
  width: 2rem;
  height: 2rem;
}
</style>
