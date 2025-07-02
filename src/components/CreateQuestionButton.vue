<template>
  <div>
    <div
      :class="isInSlot ? `new-variant` : `exercise-item new-exercise`"
      @click="openForm"
    >
      <span :class="isInSlot ? `variant-title` : `exercise-title`">
        <AddIcon class="plus-icon"/>
        {{ props.isInSlot ? "New variant" : "New question" }}
      </span>
    </div>

    <form
      v-if="isOpen"
      @submit.prevent="handleSubmit"
      class="exercise-form"
      ref="formRef"
    >
      <XIcon class="close-button" @click="openForm"/>

      <div class="newExercise" v-if="isInSlot">
        <label for="title">Title</label>
        <input
          id="title"
          class="text-input"
          type="text"
          v-model="InputTitle"
          placeholder="Enter question title..."
          required
        />
      </div>

      <div class="newExercise" v-if="isInSlot">
        <label for="description">Description</label>
        <textarea
          id="description"
          class="text-input"
          v-model="InputDescription"
          placeholder="Enter question description..."
          rows="5"
          required
        ></textarea>
      </div>

      <div class="newExercise" v-if="!isInSlot">
        <label for="type">Question type</label>
        <select id="type" v-model="SelectedType" class="styled-select">
          <option value="MULTI_CHOICE">Multiple choice</option>
          <option value="TRUE_FALSE">True or false</option>
          <option value="SHORT_ANSWER">Short answer</option>
        </select>
      </div>

      <div class="newExercise" v-if="!isInSlot">
        <label for="weight">Weight</label>
        <div class="weight-input-group" v-if="!isInSlot">
          <div class="weight-control">
            <input
              type="number"
              id="weight"
              name="weight"
              min="0"
              max="100"
              v-model="percentageWeight"
              @input="enforceRange"
              @change="handleWeightChange"
              ref="weightInputRef"
            />
            <span class="percentage-symbol">%</span>
          </div>
        </div>
      </div>

      <CustomButton type="submit" :text="isInSlot ? 'Create new variant' : 'Create new question'" color="black" :icon="CheckIcon"/>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import CheckIcon from "./icons/CheckIcon.vue";

const props = defineProps({
  onPress: Function,
  isInSlot: Boolean,
});

const isOpen = ref(false);
const InputTitle = ref("");
const InputDescription = ref("");
const SelectedType = ref("MULTI_CHOICE");
const InputWeight = ref(10.0);
const formRef = ref(null);

const openForm = () => {
  isOpen.value = !isOpen.value;
};

const handleSubmit = async () => {
  let newQuestion = {};
  if (!props.isInSlot) {
    newQuestion = {
      questionType: SelectedType.value,
      weight: InputWeight.value,
    };
  } else {
    newQuestion = {
      title: InputTitle.value,
      description: InputDescription.value,
    };
  }

  try {
    await props.onPress(newQuestion);

    // Clear form inputs
    InputTitle.value = "";
    InputDescription.value = "";
    const InputWeight = ref(10.0);
    const percentageWeight = ref(InputWeight.value); // sync on mount
    SelectedType.value = "MULTI_CHOICE";
    openForm();

    // Scroll to bottom after a short delay to ensure DOM update
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
      });
    }, 200); // delay allows question list to be rendered
  } catch (err) {
    console.error("Error creating question:", err);
  }
};

const handleClickOutside = (event) => {
  if (isOpen.value && formRef.value && !formRef.value.contains(event.target)) {
    openForm();
  }
};

const percentageWeight = ref(10); // this mirrors InputWeight in percentage (0–100)

const enforceRange = () => {
  if (percentageWeight.value < 1) percentageWeight.value = 0;
  if (percentageWeight.value > 100) percentageWeight.value = 100;
};

const handleWeightChange = () => {
  enforceRange();

  // Sync InputWeight with percentageWeight
  InputWeight.value = percentageWeight.value;

  // Optional alert if value is invalid
  if (percentageWeight.value < 1 || percentageWeight.value > 100) {
    window.alert("Weight value must be between 1 and 100!");
    percentageWeight.value = InputWeight.value;
    return;
  }
};

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
});
</script>

<style scoped>
.new-variant {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px 6px;
  border: 2px dashed var(--vt-c-purple-light);
  border-radius: 10px;
  cursor: pointer;
  color: var(--vt-c-grey-dark);
  transition: all 0.2s ease;
}

.new-variant:hover {
  background-color: color-mix(in srgb, var(--vt-c-purple-light), white 90%);
}

.variant-title {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  font-size: 1rem;
  font-weight: bold;
}

.exercise-item.new-exercise {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px dashed var(--vt-c-grey);
  border-radius: 10px;
  cursor: pointer;
  color: var(--vt-c-grey-dark);
  transition: all 0.2s ease;
  justify-content: center;
}

.exercise-item.new-exercise:hover {
  background-color: color-mix(in srgb, var(--vt-c-grey), white 80%);
}

.exercise-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  font-weight: bold;
  color: color-mix(in srgb, var(--vt-c-grey), black 20%);
}

.plus-icon {
  width: 20px;
  height: 20px;
  color: var(--vt-c-purple-dark);
}

.exercise-form {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--vt-c-white);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  padding: 1.5rem;
  width: 90%;
  max-width: 500px;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  border: 2px solid var(--vt-c-grey);
}

.exercise-form :deep(.custom-button) {
  align-self: center;
  width: auto;
  max-width: 100%;
}

.close-button {
  cursor: pointer;
  position: absolute;
  top: 15px;
  right: 15px;
  width: 20px;
  height: 20px;
}

div.newExercise {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: large;
  align-items: start;
  width: 100%;
}

label {
  font-size: 1.5rem;
}

.text-input {
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

.text-input:focus {
  outline: none;
  border-bottom-color: var(--vt-c-purple-light);
}

.weight-input-group {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.weight-control {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
}

.percentage-symbol {
  font-size: 1.5rem;
  font-weight: bold;
  margin-right: 1rem;
  color: var(--vt-c-purple-dark);
}

input[type="number"] {
  border: none;
  font-size: 1.5rem;
  text-align: center;
  font-weight: bold;
  color: var(--vt-c-purple-dark);
  width: auto;
  min-width: 2ch;
  max-width: 5ch;
  background-color: transparent;
  padding: 0;
}

/* Hide spinner arrows for Chrome, Safari, Edge, Opera */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"]:focus {
  outline: none;
  border-color: var(--vt-c-purple);
  transition: border-color 0.2s ease;
}

.styled-select {
  appearance: none;
  background-color: transparent;
  border: none;
  border-bottom: 2px solid color-mix(in srgb, var(--vt-c-purple), white 75%);
  font-size: 1rem;
  line-height: 1.4;
  padding: 4px 0;
  width: 100%;
  font-family: "Circular", sans-serif;
  font-weight: lighter;
  color: var(--vt-c-text-dark-1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.styled-select:focus {
  outline: none;
  border-bottom-color: var(--vt-c-purple-light);
}

.styled-select option {
  color: var(--vt-c-text-dark-1);
  background-color: var(--vt-c-white);
}

button.submitter {
  background-color: var(--purple-button);
  width: 180px;
  height: 40px;
  border-radius: 20px;
  font-weight: bold;
  color: white;
  border: none;
  cursor: pointer;
}

</style>
