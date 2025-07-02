<template>
  <div>
    <div class="exercise-item new-exercise" @click="openForm">
      <span class="exercise-title">
        <span class="plus-icon">+</span>
        New Exercise
      </span>
    </div>

    <form v-if="isOpen" @submit.prevent="handleSubmit" class="exercise-form">
      <button type="button" class="close-button" @click="openForm">×</button>

      <div class="newExercise">
        <label for="title">Title:</label>
        <input
          id="title"
          type="text"
          v-model="InputTitle"
          placeholder="Enter exercise title..."
          required
        />
      </div>

      <div class="newExercise">
        <label for="description">Description:</label>
        <textarea
          id="description"
          v-model="InputDescription"
          placeholder="Enter exercise description..."
          rows="5"
          required
        ></textarea>
      </div>

      <button class="submitter" type="submit">Create New Exercise</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useExerciseStore } from "@/stores/exerciseStore";

const props = defineProps({
  topicId: {
    type: String,
    required: true,
  },
});

const currExercise = useExerciseStore();

const isOpen = ref(false);
const InputTitle = ref("");
const InputDescription = ref("");

const openForm = () => {
  isOpen.value = !isOpen.value;
};

const handleSubmit = async () => {
  try {
    await currExercise.createExercise(
      props.topicId,
      InputTitle.value,
      InputDescription.value
    );
    InputTitle.value = "";
    InputDescription.value = "";
    openForm();
  } catch (err) {
    console.error("Error creating exercise:", err);
  }
};
</script>

<style scoped>
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
  font-size: 1.2rem;
  font-weight: bold;
  color: color-mix(in srgb, var(--vt-c-grey), black 20%);
}

.plus-icon {
  margin-right: 0.5rem;
  font-size: 1.4rem;
  color: var(--vt-c-purple-dark);
}

.exercise-form {
  position: fixed;
  background-color: var(--vt-c-white);
  display: flex;
  flex-direction: column;
  width: 30%;
  border-radius: 20px;
  padding: 30px;
  align-items: center;
  gap: 30px;
  border: 2px solid var(--vt-c-divider-dark-1);
  z-index: 2000;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
}

button.close-button {
  position: absolute;
  background-color: var(--vt-c-text-dark-2);
  font-size: x-large;
  border: 0;
  top: 20px;
  right: 15px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  padding: 0 0 4px;
}

div.newExercise {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: large;
  align-items: start;
  width: 100%;
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

input[type="text"],
textarea {
  border: none;
  border-bottom: 1px solid var(--input-underline-text);
  width: 100%;
}

input[type="text"]:focus,
textarea:focus {
  outline: 0;
  border-bottom: 2px solid var(--input-underline-focus);
  transition: 0.1s;
}
</style>
