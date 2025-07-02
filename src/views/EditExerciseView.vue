<template>
  <main class="edit-exercise-view" v-if="!isLoading">
    <div v-if="currentExercise.exercise" class="container">
      <!-- Header with navigation and action buttons -->
      <div class="header-actions">
        <BackArrow @click="goBack" class="back-icon" />

        <div class="action-buttons">
          <CustomButton
            text="Balance weights"
            :icon="BalanceIcon"
            color="black"
            @click="balanceWeight"
            title="Distribute question weights evenly"
          />
          <CustomButton
            text="Shuffle questions"
            :icon="ShuffleIcon"
            color="black"
            @click="shuffleQuestions"
            title="Randomize question order"
          />
          <CustomButton
            text="Save"
            :icon="SaveIcon"
            :color="isDirty ? 'green' : 'grey'"
            :disabled="!isDirty"
            @click="saveChanges"
            title="Save all changes"
          />
          <CustomButton
            text="Publish"
            :icon="PublishIcon"
            color="purple"
            :disabled="!exercise.isDraft"
            @click="publishExercise"
          />
        </div>
      </div>

      <!-- Exercise title and description form -->
      <form class="exercise-form" @submit.prevent>
        <input
          class="title-input"
          type="text"
          id="title"
          name="title"
          minlength="1"
          v-model="exercise.title"
          placeholder="Title"
          @blur="handleInfoChange"
          @input="handleInputChange"
        />

        <textarea
          class="description-input"
          id="description"
          name="description"
          minlength="1"
          rows="2"
          v-model="exercise.description"
          placeholder="Description"
          @blur="handleInfoChange"
          @input="handleInputChange"
        ></textarea>
      </form>

      <!-- Questions list -->
      <div class="questions-container">
        <h3 class="questions-heading" v-if="questions.length > 0">Questions</h3>
        <div class="questions-list">
          <!-- Add new question button -->
          <CreateQuestionButton :onPress="newQuestion" :isInSlot="false" />

          <!-- Questions List with Drag & Drop and Smooth Animations -->
          <TransitionGroup
            name="question-list"
            tag="ul"
            class="question-transition-group"
            :css="true"
          >
            <li
              v-for="(question, index) in questions"
              :key="question.questionSlotDTO.id"
              class="question-item"
              :class="{ 
                'dragging': draggedIndex === index,
                'drag-over': dragOverIndex === index && draggedIndex !== index
              }"
              @dragover.prevent="handleDragOver($event)"
              @dragenter.prevent="handleDragEnter(index, $event)"
              @dragleave="handleDragLeave($event)"
              @drop.prevent="handleDrop(index, $event)"
            >
              <QuestionSlot
                :questionSlot="question.questionSlotDTO"
                :questions="question.questions"
                @drag-start="(e) => handleDragStart(index, e)"
                @drag-end="handleDragEnd"
              />
            </li>
          </TransitionGroup>
        </div>

        <div v-if="questions.length === 0" class="no-questions">
          No questions added yet. Create your first question below.
        </div>
      </div>
    </div>

    <Toast v-if="showToast" :message="toastMessage" :type="toastType" />
  </main>
  <div v-else class="loading">
    <p>Loading exercise...</p>
  </div>
</template>

<script setup>
// General imports
import { storeToRefs } from "pinia";
import { onBeforeMount, onMounted, onBeforeUnmount, watch, ref } from "vue";
import { useRoute, useRouter, onBeforeRouteLeave } from "vue-router";
import { TransitionGroup } from "vue";

// Stores
import { useExerciseEditStore } from "@/stores/exerciseEdit";
const currentExercise = useExerciseEditStore();

// Components
import QuestionSlot from "@/components/QuestionSlot.vue";
import CreateQuestionButton from "@/components/CreateQuestionButton.vue";
import CustomButton from "@/components/CustomButton.vue";
import ShuffleIcon from "@/components/icons/ShuffleIcon.vue";
import BalanceIcon from "@/components/icons/BalanceIcon.vue";
import SaveIcon from "@/components/icons/SaveIcon.vue";
import PublishIcon from "@/components/icons/PublishIcon.vue";
import BackArrow from "@/components/icons/BackArrow.vue";
import Toast from "@/components/Toast.vue";

// Setup
const router = useRouter();
const route = useRoute();
const TopicId = route.params.topicId;
const ExerciseId = route.params.exerciseId;
// info handling
let originalTitle = "";
let originalDescription = "";
const { exercise, questions } = storeToRefs(currentExercise);
// toast message info
const toastMessage = ref("");
const toastType = ref("");
const showToast = ref(false);
// meta data
const isLoading = ref(false);
const isDirty = ref(false);

// Drag and drop state
const draggedIndex = ref(null);
const dragOverIndex = ref(null);
const isAnimating = ref(false);

// Watch the dirty state for changes
watch(
  () => currentExercise.dirty,
  (newDirtyState) => {
    isDirty.value = newDirtyState;
  },
  { immediate: false }
);

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
});

onBeforeRouteLeave((to, from, next) => {
  // Only prompt if there are actual unsaved changes
  if (currentExercise.checkForChanges()) {
    const leave = window.confirm(
      "You have unsaved changes. Are you sure you want to leave?"
    );
    if (!leave) {
      next(false);
    } else {
      currentExercise.clearStore();
      next();
    }
  } else {
    next();
  }
});

// Load exercise data
onBeforeMount(async () => {
  if (!currentExercise.exercise) {
    isLoading.value = true;
    await currentExercise.fetchExercise(ExerciseId);
    isLoading.value = false;
  }
});

// Watch for exercise changes to track original values
watch(
  () => exercise.value,
  (newExercise) => {
    if (newExercise) {
      originalTitle = newExercise.title;
      originalDescription = newExercise.description;
    }
  },
  { immediate: true }
);

// Drag and Drop handlers
let dragLeaveTimeout = null;

const handleDragStart = (index, event) => {
  draggedIndex.value = index;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/html', ''); // For Firefox compatibility
};

const handleDragEnd = (event) => {
  draggedIndex.value = null;
  dragOverIndex.value = null;
  
  // Clear any pending timeout
  if (dragLeaveTimeout) {
    clearTimeout(dragLeaveTimeout);
    dragLeaveTimeout = null;
  }
};

const handleDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  
  // Clear any pending drag leave timeout
  if (dragLeaveTimeout) {
    clearTimeout(dragLeaveTimeout);
    dragLeaveTimeout = null;
  }
};

const handleDragEnter = (index, event) => {
  event.preventDefault();
  
  // Clear any pending timeout
  if (dragLeaveTimeout) {
    clearTimeout(dragLeaveTimeout);
    dragLeaveTimeout = null;
  }
  
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    dragOverIndex.value = index;
  }
};

const handleDragLeave = (event) => {
  // Use timeout to prevent flickering when moving between child elements
  dragLeaveTimeout = setTimeout(() => {
    // Only clear if we're actually leaving the item and not entering a child
    if (!event.currentTarget.contains(event.relatedTarget)) {
      dragOverIndex.value = null;
    }
  }, 50);
};

const handleDrop = (dropIndex, event) => {
  event.preventDefault();
  event.stopPropagation();
  
  // Clear any pending timeout
  if (dragLeaveTimeout) {
    clearTimeout(dragLeaveTimeout);
    dragLeaveTimeout = null;
  }
  
  if (draggedIndex.value !== null && draggedIndex.value !== dropIndex) {
    // Set animation state
    isAnimating.value = true;
    
    // Reorder questions using the store method
    const fromIndex = draggedIndex.value;
    const toIndex = dropIndex;
    
    // Call store method to reorder questions
    currentExercise.reorderQuestionsByIndex(fromIndex, toIndex);
    
    // Reset animation state after transition completes
    setTimeout(() => {
      isAnimating.value = false;
    }, 500);
  }
  
  draggedIndex.value = null;
  dragOverIndex.value = null;
};

/**
 * Handle real-time input changes to detect changes immediately
 * This will update the dirty state as soon as the user types
 */
const handleInputChange = () => {
  if (!exercise.value) return;

  // Set dirty state directly if content has changed from original
  if (
    originalTitle !== exercise.value.title ||
    originalDescription !== exercise.value.description
  ) {
    // Force dirty state to true without waiting for checkForChanges
    currentExercise.dirty = true;
  } else {
    // If content matches original, check if other changes exist
    currentExercise.setDirty();
  }
};

/**
 * Handle changes to exercise title and description
 * Validates that neither field is empty
 */
const handleInfoChange = () => {
  if (
    originalTitle !== exercise.value.title ||
    originalDescription !== exercise.value.description
  ) {
    currentExercise.setDirty();
    originalTitle = exercise.value.title;
    originalDescription = exercise.value.description;
  }
};

/**
 * Save exercise changes to database
 */
const saveChanges = async () => {
  const res = currentExercise.validateInfo();
  if (res[0]) {
    await updateInfo(
      exercise.value.title,
      exercise.value.description,
      ExerciseId
    );
  } else {
    if (res.length == 2) {
      toastMessage.value = `Couldn't save exercise: faulty ${res[1]}`;
    } else {
      toastMessage.value = `Couldn't save exercise: faulty ${res[1]} and ${res[2]}`;
    }
    toastType.value = "error";
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 3000);
  }
};

/**
 * Save exercise changes to database
 */
const updateInfo = async (title, description, exerciseId) => {
  const updatedExercise = {
    id: exerciseId,
    title: title,
    description: description,
    isDraft: true,
    topicReference: exercise.value.topicReference,
  };
  const res = await currentExercise.saveExercise(updatedExercise, exerciseId);
  if (res[0] === 200) {
    toastMessage.value = "Exercise saved successfully!";
    toastType.value = "success";
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 3000);
  } else {
    toastMessage.value = `Couldn't save exercise: faulty ${res[1]}`;
    toastType.value = "error";
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 3000);
  }
};

/**
 * Create a new question in the exercise
 */
const newQuestion = async (newQuestion) => {
  newQuestion.weight = newQuestion.weight / 100;

  if (newQuestion.weight < 0 || newQuestion.weight > 1) {
    window.alert(`Weight value ${newQuestion.weight} is out of bounds (0-1)`);
    return;
  }

  newQuestion.exerciseReference = ExerciseId;
  await currentExercise.createQuestion(newQuestion);
};

/**
 * Publish exercise if it's valid and all changes are saved
 */
const publishExercise = async () => {
  if (currentExercise.dirty) {
    window.alert("Please save your changes before publishing");
    return;
  }

  if (currentExercise.validateExercise()) {
    await currentExercise.publishExercise(ExerciseId);
    router.push({
      name: "exercises",
      params: { topicId: TopicId },
    });
  } else {
    window.alert(
      "This exercise is not ready to be published. Please check that all questions are complete."
    );
  }
};

/**
 * Distribute weights evenly across all questions
 */
const balanceWeight = () => {
  currentExercise.balanceWeight();
};

/**
 * Randomize question order
 */
const shuffleQuestions = () => {
  currentExercise.shuffleQuestions();
};

/**
 * Navigate back to exercise list
 */
const goBack = () => {
  router.push({
    name: "exercises",
    params: { topicId: TopicId },
  });
};

/**
 * handler for page reloads, tab closing and such, in case the exercise was edited it
 * shows a default browser pop up notifying the user
 */
function handleBeforeUnload(event) {
  if (currentExercise.checkForChanges()) {
    event.preventDefault();
    event.returnValue = undefined;
  }
}
</script>

<style scoped>
.edit-exercise-view {
  color: var(--vt-c-black);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
}

.container {
  max-width: 800px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header & navigation styles */
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.back-icon {
  cursor: pointer;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

/* Form styles */
.exercise-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.title-input {
  font-size: 1.75rem;
  font-weight: bold;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  transition: all 0.2s ease;
  font-family: "Circular"
}

.description-input {
  resize: vertical;
  border: none;
  border-bottom: 2px solid var(--vt-c-grey-light);
  font-size: 1rem;
  border-radius: 0 !important;
  box-shadow: none !important;
  background-color: transparent !important;
  transition: border-bottom-color 0.2s ease;
  font-family: "Circular";
  font-weight: lighter;
  color: var(--vt-c-grey-dark);
}

.description-input:focus {
  outline: none;
  border-bottom-color: var(--vt-c-purple);
}

input[type="text"] {
  width: 100%;
  background-color: transparent;
  transition: border-color 0.2s ease;
}

input[type="text"]:focus {
  outline: none;
  border-bottom-color: var(--vt-c-purple);
}

/* Questions list */
.questions-container {
  width: 100%;
}

.questions-heading {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--vt-c-grey-dark);
}

.questions-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-transition-group {
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

/* TransitionGroup animations */
.question-list-move,
.question-list-enter-active,
.question-list-leave-active {
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.question-list-enter-from {
  opacity: 0;
  transform: translateX(-30px) scale(0.95);
}

.question-list-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}

.question-list-leave-active {
  position: absolute;
  width: calc(100% - 16px);
}

.question-item {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 20px;
  position: relative;
  border: 2px solid transparent;
}

.question-item:hover:not(.dragging) {
  /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); */
}

.question-item.dragging {
  opacity: 0.7;
  transform: rotate(2deg) scale(1.02);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  background-color: white;
  border: 2px solid var(--vt-c-purple);
  /* Disable transition during drag to prevent conflicts */
  transition: none !important;
}

.question-item.drag-over:not(.dragging) {
  background-color: rgba(128, 90, 213, 0.08);
  border: 2px dashed var(--vt-c-purple);
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 8px 16px rgba(128, 90, 213, 0.2);
}

.question-item.drag-over:not(.dragging)::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--vt-c-purple), transparent);
  border-radius: 2px;
  animation: dropIndicator 1s ease-in-out infinite alternate;
}

@keyframes dropIndicator {
  from {
    opacity: 0.6;
    transform: translateX(-50%) scaleX(0.8);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scaleX(1);
  }
}

/* Drag handle styles */
.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  min-width: 24px;
  height: 40px;
  cursor: grab;
  opacity: 0.4;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0 4px;
  border-radius: 6px;
}

.drag-handle:hover {
  opacity: 0.8;
  background-color: rgba(128, 90, 213, 0.1);
  transform: scale(1.1);
}

.question-item.dragging .drag-handle {
  opacity: 1;
  background-color: var(--vt-c-purple);
}

.question-item.dragging .drag-handle .drag-dots span {
  background-color: white;
}

.drag-handle:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.drag-dots {
  display: grid;
  grid-template-columns: repeat(2, 4px);
  grid-template-rows: repeat(3, 4px);
  gap: 2px;
  transition: all 0.2s ease;
}

.drag-dots span {
  width: 4px;
  height: 4px;
  background-color: var(--vt-c-grey);
  border-radius: 50%;
  transition: all 0.2s ease;
}

.no-questions {
  text-align: center;
  color: var(--vt-c-grey);
  padding: 2rem 0;
  border: 2px dashed var(--vt-c-grey-light);
  border-radius: 8px;
}

/* Loading state */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  width: 100%;
  color: var(--vt-c-grey-dark);
}

/* Mobile responsive drag handle */
@media (max-width: 768px) {
  .drag-handle {
    width: 32px;
    min-width: 32px;
    height: 48px;
  }
  
  .drag-dots {
    grid-template-columns: repeat(2, 5px);
    grid-template-rows: repeat(3, 5px);
    gap: 3px;
  }
  
  .drag-dots span {
    width: 5px;
    height: 5px;
  }
}
</style>