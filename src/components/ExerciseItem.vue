<template>
  <div
    class="exercise-card"
    :class="{
      'clickable-card': userStore.user.isInstructor,
      draft: exercise.isDraft,
    }"
    @click="handleExerciseClick"
  >
    <div class="card-content">
      <div class="card-header">
        <span class="icon" v-if="!exercise.isDraft"><ExerciseIcon /></span>
        <span class="icon-draft" v-if="exercise.isDraft"
          ><EyeClosedIcon
        /></span>
        <h3 class="title" :class="{ 'draft-text': exercise.isDraft }">
          {{ exercise.title }} {{ exercise.isDraft ? "[DRAFT]" : "" }}
        </h3>
        <div v-if="userStore.user.isInstructor" class="actions">
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
              <button class="dropdown-item" @click="attemptExercise">
                <AttemptIcon class="item-icon" /> Preview
              </button>
              <button class="dropdown-item" @click="deleteExercise">
                <DeleteIcon class="item-icon" /> Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card-body">
        <div class="content">
          <p class="description" :class="{ 'draft-text': exercise.isDraft }">
            {{ exercise.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- Student action buttons -->
    <div v-if="!userStore.user.isInstructor" class="student-actions">
      <CustomButton
        :text="exercise.isAttempted ? 'Retry' : 'Attempt'"
        :icon="exercise.isAttempted ? RetryIcon : AttemptIcon"
        :color="exercise.isAttempted ? 'orange' : 'green'"
        @click="attemptExercise"
      />
      <CustomButton
        text="Feedback"
        :icon="FeedbackIcon"
        :color="exercise.isAttempted ? 'purple' : 'grey'"
        :disabled="!exercise.isAttempted"
        @click="reviewExercise"
      />
    </div>
  </div>
</template>

<script setup>
// IMPORTS
import ExerciseIcon from "../components/icons/ExerciseIcon.vue";
import DeleteIcon from "./icons/DeleteIcon.vue";
import MoreIcon from "./icons/MoreIcon.vue";
import EyeClosedIcon from "./icons/EyeClosedIcon.vue";
import CustomButton from "./CustomButton.vue";
import { useAuthUserStore } from "@/stores/authUser";
import { useRouter, useRoute } from "vue-router";
import { useExerciseEditStore } from "@/stores/exerciseEdit";
import { useExerciseStore } from "@/stores/exerciseStore";
import { ref, onMounted, onBeforeUnmount } from "vue";
import AttemptIcon from "./icons/AttemptIcon.vue";
import FeedbackIcon from "./icons/FeedbackIcon.vue";
import RetryIcon from "./icons/RetryIcon.vue";
import { useExerciseAttemptStore } from "@/stores/exerciseAttempt";

// PROPS
const props = defineProps({
  exercise: {
    type: Object,
    required: true,
  },
});

// CONSTANTS
const userStore = useAuthUserStore();
const router = useRouter();
const route = useRoute();
const exerciseEditStore = useExerciseEditStore();
const exerciseAttemptStore = useExerciseAttemptStore();
const exercisesStore = useExerciseStore();

const TopicId = route.params.topicId;

// Menu state
const showMenu = ref(false);
const menuRef = ref(null);
const menuButtonRef = ref(null);

/**
 * checks whether exerciseEdit store already contains correct exercise, else fetches it
 */
async function exerciseLoadEdit() {
  if (!exerciseEditStore.exercise || exerciseEditStore.exercise.id !== props.exercise.id) {
    await exerciseEditStore.fetchExercise(props.exercise.id);
  }
}

/**
 * fetches exercise for the attempt/review
 */
async function exerciseLoadAttempt(isReview) {
    await exerciseAttemptStore.fetchExercise(props.exercise.id, isReview);
}


/**
 * fetches feedback for the exercise
 */
async function feedbackLoad() {
  await exerciseAttemptStore.fetchFeedback(props.exercise.id);
  await exerciseAttemptStore.fetchAllLastAIQuestionFeedback();
}

// Toggle menu with proper event handling
const toggleMenu = (event) => {
  event.stopPropagation();
  showMenu.value = !showMenu.value;
};

// Close menu when clicking outside
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
 * redirects to page to edit exercise and loads correct exercise if not already present
 */
const editExercise = async (event) => {
  event.stopPropagation();
  await exerciseLoadEdit();
  router.push({
    name: "EditExercise",
    params: { exerciseId: props.exercise.id, topicId: TopicId },
  });
  showMenu.value = false;
};

/**
 * redirects to page to attempt an exercise, loads correct exercise in case it's not already stored
 */
const attemptExercise = async (event) => {
  event?.stopPropagation();
  await exerciseLoadAttempt(false);
  
  if (!exerciseAttemptStore.validateExercise()) {
    window.alert("exercise can't be previewed because it's not complete!");
    return;
  }
  
  router.push({
    name: "ExerciseView",
    params: { exerciseId: props.exercise.id, topicId: TopicId },
    query: {
      mode: "attempt",
      topic: router.currentRoute.value.query.topic,
    },
  });
};

/**
 * redirects to page to review an exercise, loads correct exercise in case it's not already stored
 */
const reviewExercise = async (event) => {
  event?.stopPropagation();
  // Only proceed if the exercise has been attempted
  if (!props.exercise.isAttempted) {
    return;
  }

  await exerciseLoadAttempt(true);
  await feedbackLoad();
  router.push({
    name: "ExerciseView",
    params: { exerciseId: props.exercise.id, topicId: TopicId },
    query: {
      mode: "review",
      topic: router.currentRoute.value.query.topic,
    },
  });
};

const viewStats = (event) => {
  event.stopPropagation();
  router.push({
    name: "ExerciseStatistics",
    params: { exerciseId: props.exercise.id, topicId: TopicId },
  });
};

const deleteExercise = (event) => {
  event.stopPropagation();
  exercisesStore.deleteExercise(props.exercise.id);
  showMenu.value = false;
};

const handleExerciseClick = (event) => {
  // Don't do anything if the menu is open
  if (showMenu.value) return;
  if (userStore.user.isInstructor && !props.exercise.isDraft) {
    viewStats(event);
  } else if (userStore.user.isInstructor && props.exercise.isDraft) {
    editExercise(event);
  }
};

// Event listeners for outside clicks
onMounted(() => {
  document.addEventListener("click", closeMenuOnOutsideClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeMenuOnOutsideClick);
});
</script>

<style scoped>
.exercise-card {
  background-color: var(--vt-c-white);
  border: 2px solid var(--vt-c-grey-light);
  border-radius: 16px;
  padding: 1rem;
  width: 100%;
  display: flex;
  position: relative;
  transition: border-color 0.2s ease;
}
.exercise-card:hover {
  border-color: var(--vt-c-grey);
}
.clickable-card {
  cursor: pointer;
}
.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  position: relative;
}
.icon {
  font-size: 1.2rem;
  color: var(--vt-c-grey-dark);
}
.icon-draft {
  font-size: 1.2rem;
  color: color-mix(in srgb, var(--vt-c-grey), black 20%);
}
.title {
  font-size: 1.25rem;
  font-weight: bold;
  flex-grow: 1;
  margin: 0;
}
.actions {
  position: relative;
}
.more-button {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
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
.card-body {
  display: flex;
  margin-top: 0.5rem;
}
.content {
  padding-left: 2.5rem;
  flex: 1;
}
.description {
  color: var(--vt-c-grey-dark);
  font-weight: lighter;
  margin: 0;
}
.student-actions {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  justify-content: center;
  margin-left: 1rem;
}
.teacher-stats {
  margin-top: 10px;
}
.draft-text {
  color: color-mix(in srgb, var(--vt-c-grey), black 20%);
}
</style>
