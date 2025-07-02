<template>
  <div class="exercise-view">
    <Toast
      v-if="showToast"
      :message="toastMessage"
      :type="toastType"
      :duration="3000"
      @click="showToast = false"
    />

    <div v-if="store.exercise" class="container">
      <!-- Header with navigation -->
      <div class="header-actions">
        <BackArrow @click="goBack" class="back-icon" />
        <Tag v-if="score !== null" class="score-badge" :color="scoreColor"
          >Grade: {{ score }}%</Tag
        >
      </div>

      <!-- Exercise title and description -->
      <div class="exercise-info">
        <h1 class="title">{{ store.exercise.title }}</h1>
        <p class="description">{{ store.exercise.description }}</p>
      </div>

      <!-- Questions list -->
      <div class="questions-container">
        <Tag
          class="questions-heading"
          v-if="store.questions.length > 0"
          :icon="ExerciseIcon"
          color="orange"
        >
          {{ store.questions.length }} questions
        </Tag>
        <div class="questions-list">
          <Question
            v-for="(q, idx) in store.questions"
            :key="q.id"
            :question="q"
            :index="idx"
            v-model="store.answers[q.question.id]"
            :review-mode="isReviewMode"
          />
        </div>
      </div>

      <!-- Action buttons -->
      <div class="action-buttons" v-if="!isReviewMode && !isSubmitting">
        <CustomButton
          text="Submit Answers"
          :icon="ArrowUpIcon"
          color="green"
          @click="handleSubmit"
          :disabled="isSubmitting || store.isSubmitting"
        />
      </div>

      <div v-if="isSubmitting" class="loading-container">
        <div class="spinner"></div>
        <span>Submitting answers, please wait...</span>
      </div>
    </div>

    <div v-else class="loading">
      <p>Loading exercise...</p>
    </div>
  </div>
</template>

<script setup>
import Question from "../components/Question.vue";
import Toast from "@/components/Toast.vue";
import BackArrow from "@/components/icons/BackArrow.vue";
import CustomButton from "@/components/CustomButton.vue";
import { useRouter, useRoute } from "vue-router";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Tag from "@/components/Tag.vue";
import ArrowUpIcon from "@/components/icons/ArrowUpIcon.vue";
import ExerciseIcon from "@/components/icons/ExerciseIcon.vue";
import { useAuthUserStore } from "@/stores/authUser";
import { useExerciseAttemptStore } from "@/stores/exerciseAttempt";
import { useTopicStore } from "@/stores/topicStore";

const router = useRouter();
const route = useRoute();
const store = useExerciseAttemptStore();
const userStore = useAuthUserStore();
const isSubmitting = ref(false);

// Computed properties for mode and exercise state
const mode = computed(() => route.query.mode || "attempt");
const isReviewMode = computed(() => mode.value === "review");
const exerciseId = route.params.exerciseId;

// Toast message variables
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");

/**
 * Initialize the component by loading appropriate data based on mode
 */
onMounted(() => {
  if (!exerciseId || exerciseId === "undefined") {
    console.warn("Missing or invalid exercise ID");
    toastMessage.value = "Invalid exercise. Please try again.";
    toastType.value = "error";
    showToast.value = true;
  } else if (isReviewMode.value) {
    loadReviewData();
  } else {
    // nothing because we already fetch when clicking the attempt button in ExerciseItem.vue
  }
  window.addEventListener("beforeunload", warnInstructorsLeavingReview);
});

/**
 * Navigates back to the exercise list view using the topicId from the route params
 */
const goBack = () => {
  router.push({
    name: "exercises",
    params: {
      topicId: route.params.topicId,
    },
  });
};

/**
 * Fetches the exercise and feedback data for the review mode
 * and initializes answers with last attempt data
 */
const loadReviewData = async () => {
  await store.fetchExercise(exerciseId, isReviewMode.value);
  await store.fetchFeedback(exerciseId);
  store.fetchAllLastAIQuestionFeedback();
};

/**
 * Watch for changes in the route query parameter 'mode'
 */
watch(
  () => route.query.mode,
  (newMode, oldMode) => {
    if (
      newMode === "review" &&
      newMode !== oldMode &&
      !userStore.user.isInstructor
    ) {
      loadReviewData();
    }
  }
);

/**
 * Submits the user's answers and displays a toast based on the result
 * On success, reloads the page in 'review' mode
 */
async function handleSubmit() {
  showToast.value = false;
  if (isSubmitting.value || store.isSubmitting) {
    return;
  }

  // Check if all questions have been answered
  const unansweredQuestions = store.questions.filter((q) => {
    const questionId = q.question.id;
    const answer = store.answers[questionId];
    return (
      answer === undefined ||
      (Array.isArray(answer) && answer.length === 0) ||
      (typeof answer === "string" && answer.trim() === "")
    );
  });

  if (unansweredQuestions.length > 0) {
    confirm(
      "You have " +
        unansweredQuestions.length +
        " unanswered question(s). You need to answer all questions before submitting."
    );
  } else {
    submitAnswers();
  }
}

/**
 * Helper function to handle the actual submission process
 */
async function submitAnswers() {
  isSubmitting.value = true;
  try {
    await store.submitAttempt(exerciseId);
    toastMessage.value = "Answers submitted successfully!";
    toastType.value = "success";

    // Navigate to the same page but with mode=review
    router.replace({
      name: route.name,
      params: route.params,
      query: {
        ...route.query,
        mode: "review",
      },
    });
  } catch (err) {
    console.error("Error submitting answers:", err);
    toastMessage.value = "Failed to submit answers.";
    toastType.value = "error";
  } finally {
    isSubmitting.value = false;
    showToast.value = true;
  }
}

/**
 * Calculate the score as a percentage
 */
const score = computed(() => {
  if (store.feedback?.last_attempt) {
    const totalScore = store.feedback.last_attempt.score;
    return Math.round(totalScore * 100);
  }
  return null;
});

/**
 * Determine the color of the score badge based on the score value
 */
const scoreColor = computed(() => {
  if (score.value === null) return "purple"; // Default color
  if (score.value === 0) return "red";
  if (score.value >= 1 && score.value <= 50) return "orange";
  if (score.value >= 51 && score.value <= 70) return "yellow";
  if (score.value >= 71 && score.value <= 100) return "green";
  return "purple"; // Fallback
});

/**
 *  Remove the event listener when the component is unmounted
 */
onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", warnInstructorsLeavingReview);
  store.clearStore();
});

/**
 * Warn instructors about losing review data when refreshing
 * @param e - Event object
 */
const warnInstructorsLeavingReview = (e) => {
  if (userStore.user.isInstructor && isReviewMode.value) {
    e.preventDefault();
    return "You are in review mode. Refreshing will clear the review data.";
  }
};

/**
 * Fetching dashboard topics after an attempt so that stats are updated
 */
watch(
  () => route.query.mode,
  (newMode, oldMode) => {
    if (newMode === "review" && oldMode !== "review") {
      const topicStore = useTopicStore();
      topicStore
        .loadTopicsForDashboard()
        .catch((err) =>
          console.error("Failed to refresh topics after submission:", err)
        );
    }
  }
);
</script>

<style scoped>
.exercise-view {
  color: var(--vt-c-black);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
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
  align-items: start;
  width: 100%;
}

.back-icon {
  cursor: pointer;
}

.score-badge {
  font-size: 1rem;
  padding: 0.7rem;
}

/* Exercise info styles */
.exercise-info {
  width: 100%;
}

.title {
  font-size: 1.75rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: var(--vt-c-black);
}

.description {
  color: var(--vt-c-grey-dark);
  margin: 0;
}

/* Questions container */
.questions-container {
  width: 100%;
}

.questions-heading {
  margin-bottom: 0.75rem;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

/* Action buttons */
.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
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

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--vt-c-purple);
  margin-top: 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 3px solid var(--vt-c-grey-light);
  border-top-color: var(--vt-c-purple);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
