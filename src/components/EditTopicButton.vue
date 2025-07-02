<template>
  <div v-if="user.isInstructor && isAuthor" class="actions">
    <button
      ref="menuButtonRef"
      class="more-button"
      @click="toggleMenu"
      title="Options"
    >
      <MoreIcon class="more-icon" />
    </button>
    <div v-if="showMenu" class="menu-wrapper">
      <div ref="menuRef" class="dropdown-menu">
        <button class="dropdown-item" @click="editTopic">
          <EditIcon class="item-icon" /> Edit
        </button>
        <button class="dropdown-item" @click="deleteTopic">
          <DeleteIcon class="item-icon" /> Remove
        </button>
      </div>
    </div>
  </div>

  <form v-if="isOpen" @click.stop @submit.prevent class="topic-form">
    <button type="button" class="close-button" @click="openForm">×</button>

    <div class="newTopic">
      <label for="title">Title:</label>
      <input
        id="title"
        type="text"
        v-model="inputTitle"
        placeholder="New topic title..."
        required
      />
    </div>

    <div class="newTopic">
      <label for="description">Description:</label>
      <textarea
        id="description"
        v-model="inputDescription"
        placeholder="New topic description..."
        rows="5"
        required
      ></textarea>
    </div>

    <button class="submitter" @click="handleSubmit" type="button">
      Save changes
    </button>
  </form>
</template>

<script setup>
// IMPORTS
import { ref, onMounted, onBeforeUnmount } from "vue";
import MoreIcon from "./icons/MoreIcon.vue";
import { useAuthUserStore } from "@/stores/authUser";
import { useTopicStore } from "@/stores/topicStore";

// STORES
const topicStore = useTopicStore();
const userStore = useAuthUserStore();

// PROPS
const props = defineProps({
  topic: Object,
});

// SETUP
const user = userStore.user;
// for dropdown menu
const showMenu = ref(false);
// for edit topic form
const isOpen = ref(false);
const isAuthor = ref(user.switchEduPersonUniqueId === props.topic.authorId);
const menuRef = ref(null);
const menuButtonRef = ref(null);
const inputTitle = ref(props.topic.name);
const inputDescription = ref(props.topic.description);
let originalTitle = props.topic.name;
let originalDescription = props.topic.description;

onMounted(() => {
  document.addEventListener("click", closeMenuOnOutsideClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeMenuOnOutsideClick);
});

// FUNCTIONS

/**
 * toggles drop down menu on and off
 * @param event used to prevent event propagation
 */
const toggleMenu = (event) => {
  event.stopPropagation();
  showMenu.value = !showMenu.value;
};

/**
 * used to automatically close the dropdown menu when clicking away
 * @param event used to distinguish the target of the event in the DOM
 */
const closeMenuOnOutsideClick = (event) => {
  if (
    showMenu.value &&
    menuRef.value &&
    !menuRef.value.contains(event.target) &&
    !menuButtonRef.value.contains(event.target)
  ) {
    showMenu.value = false;
  }
};

/**
 * opens edit topic form
 */
const openForm = () => {
  isOpen.value = !isOpen.value;
};

/**
 * opens form and closes dropdown menu
 * @param event used to stop event propagation
 */
const editTopic = async (event) => {
  event.stopPropagation();
  toggleMenu(event);
  openForm();
};

/**
 * Delete a specific topic, of which the user is the author
 * @param event used to stop propagation
 */
const deleteTopic = async (event) => {
  event.stopPropagation();
  await topicStore.deleteTopic(props.topic.id);
  showMenu.value = false;
};

/**
 * submits new topic info to edit a specific topic of which the user is the author
 * @param event used to stop propagation
 */
const handleSubmit = (event) => {
  event.stopPropagation();
  if (inputTitle.value === "" || inputDescription.value === "") {
    window.alert("Title and description of a topic can't be empty!");
    inputTitle.value = originalTitle;
    inputDescription.value = originalDescription;
    return;
  }
  if (
    inputTitle.value !== originalTitle ||
    inputDescription.value !== originalDescription
  ) {
    topicStore.editTopic(
      inputTitle.value,
      inputDescription.value,
      props.topic.id
    );
    originalTitle = inputTitle.value;
    originalDescription = inputDescription.value;
  }
  openForm();
};
</script>

<style scoped>
.actions {
  position: absolute;
  top: 10px;
  right: 10px;
}

.more-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 50%;
}
.more-button:hover {
  background-color: var(--vt-c-grey-light);
}
.more-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.menu-wrapper {
  position: absolute;
  top: 2rem;
  right: 0;
  z-index: 20;
}
.dropdown-menu {
  position: relative;
  background: var(--vt-c-white);
  border: 2px solid var(--vt-c-grey-light);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  z-index: 20;
}
.dropdown-item {
  background: transparent;
  border: none;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--vt-c-grey-dark);
}
.dropdown-item:hover {
  background: var(--vt-c-grey-light);
}
.dropdown-item:first-child {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}
.dropdown-item:last-child {
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}
.item-icon {
  margin-right: 0.5rem;
  width: 1rem;
  height: 1rem;
}

button.close-button {
  cursor: pointer;
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

.topic-form {
  cursor: default;
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
</style>
