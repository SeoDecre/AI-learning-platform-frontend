<template>
  <button class="create-topic-button" @click="openForm">
    <AddIcon />
  </button>

  <form v-if="isOpen" @submit.prevent="handleSubmit" class="topic-form">
    <button type="button" class="close-button" @click="openForm">×</button>

    <div class="newTopic">
      <label for="title">Title:</label>
      <input
        id="title"
        type="text"
        v-model="inputTitle"
        placeholder="Enter topic title..."
        required
      />
    </div>

    <div class="newTopic">
      <label for="description">Description:</label>
      <textarea
        id="description"
        v-model="inputDescription"
        placeholder="Enter topic description..."
        rows="5"
        required
      ></textarea>
    </div>

    <button class="submitter" type="submit">Create New Topic</button>
  </form>
</template>

<script setup>
// IMPORTS
import { ref } from "vue";
import { useTopicStore } from "@/stores/topicStore";
import AddIcon from "./icons/AddIcon.vue";

// STORES
const topicStore = useTopicStore();

// SETUP
const inputTitle = ref("");
const inputDescription = ref("");
const isOpen = ref(false);

// FUNCTIONS
/**
 * toggles form visibility
 */
const openForm = () => {
  isOpen.value = !isOpen.value;
};

/**
 * handles topic creation
 */
const handleSubmit = () => {
  if (!inputTitle.value || !inputDescription.value) {
    window.alert("Title and description can't be empty!");
    return;
  }
  const newTopic = {
    name: inputTitle.value,
    description: inputDescription.value,
  };
  topicStore.createTopic(newTopic);
  openForm();
  inputTitle.value = "";
  inputDescription.value = "";
};
</script>

<style scoped>
.create-topic-button {
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background-color: var(--vt-c-purple);
  border: 2px solid var(--vt-c-purple-dark);
  border-radius: 15px;
  cursor: pointer;
  padding: 0;
}

.topic-form {
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
  cursor: pointer;
  position: absolute;
  background-color: var(--vt-c-text-dark-2);
  font-size: x-large;
  border: none;
  top: 20px;
  right: 15px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  line-height: 1;
}

.newTopic {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  outline: none;
  border-bottom: 2px solid var(--input-underline-focus);
  transition: 0.1s;
}
</style>
