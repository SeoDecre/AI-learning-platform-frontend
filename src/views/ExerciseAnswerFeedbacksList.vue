<template>
  <div class="review-list-view">
    <div class="header-actions">
      <BackArrow @click="goBack" class="back-icon" />
    </div>

    <div v-if="currentQuestion" class="question-header">
      <component :is="questionIconComponent" class="question-icon" />
      <h1 class="question-title">{{ currentQuestion?.title }}</h1>
    </div>
    <p class="question-description">{{ currentQuestion?.description }}</p>

    <!-- loading -->
    <div v-if="isLoading" class="loading">Loading reviews&hellip;</div>

    <!-- empty state -->
    <div v-else-if="reviews.length === 0" class="empty">
      <p>No attempts to review for this question</p>
    </div>

    <!-- list -->
    <div v-else class="reviews">
      <template v-for="(r, index) in reviews" :key="`review-${index}`">
        <ReviewOpenQuestionItem
          v-if="currentQuestion?.type === 'SHORT_ANSWER'"
          :review="r"
          :exerciseId="route.params.exerciseId"
          @review-handled="handleReviewHandled"
        />
        <ReviewNotOpenQuestionItem
          v-else
          :review="r"
          :exerciseId="route.params.exerciseId"
          @review-handled="handleReviewHandled"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeMount, onBeforeUnmount, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import ReviewOpenQuestionItem from "@/components/ReviewOpenQuestionItem.vue";
import ReviewNotOpenQuestionItem from "@/components/ReviewNotOpenQuestionItem.vue";
import { useExerciseAttemptStore } from "@/stores/exerciseAttempt";
import { useFeedbackStore } from "@/stores/feedback";
import MultiChoiceIcon from "@/components/icons/MultiChoiceIcon.vue";
import TrueFalseIcon from "@/components/icons/TrueFalseIcon.vue";
import ShortAnswerIcon from "@/components/icons/ShortAnswerIcon.vue";

const route = useRoute();
const router = useRouter();
const attemptStore = useExerciseAttemptStore();
const feedbackStore = useFeedbackStore();

const isLoading = ref(true);
const reviews = ref([]);
const currentQuestion = ref(null);

const goBack = () => {
  if (isLoading.value) return;
  router.push({
    name: "ExerciseStatistics",
    params: {
      topicId: route.params.topicId,
      exerciseId: route.params.exerciseId,
    },
  });
};

onBeforeMount(async () => {
  isLoading.value = true;
  const exerciseId = route.params.exerciseId;
  const questionId = route.query.questionId || route.params.questionId;

  try {
    // Fetch exercise and questions first
    await attemptStore.fetchFullExercise(exerciseId);

    // Find the specific question
    currentQuestion.value = attemptStore.findVariant(questionId);

    if (!currentQuestion.value) {
      console.warn("Question not found:", questionId);
      reviews.value = [];
      return;
    }

    // Fetch reviews based on question type
    if (currentQuestion.value.type === "SHORT_ANSWER") {
      // For short answer questions, fetch SAQ grades
      const allSAQGrades = await attemptStore.fetchSAQGradesToReview(
        exerciseId
      );
      reviews.value = allSAQGrades.filter((r) => r.questionId === questionId);
    } else {
      // For TRUE_FALSE and MULTI_CHOICE questions, fetch AI feedbacks for the specific question
      await feedbackStore.getFeedbacks(questionId);

      // Then filter for the current question
      reviews.value = feedbackStore.feedbacks;
    }
  } catch (err) {
    console.error("Failed to load reviews:", err);
    reviews.value = [];
  } finally {
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  // Only clear if we're navigating away from exercise-related pages
  const isExerciseRoute = router.currentRoute.value.name?.includes("Exercise");
  if (!isExerciseRoute) {
    attemptStore.clearStore();
  }
});

// remove a review from the array as soon as it is accepted / modified
const handleReviewHandled = (handledReview) => {
  // we remove by the unique pair <solvedExerciseReference, questionId>
  reviews.value = reviews.value.filter(
    (r) =>
      !(
        r.solvedExerciseReference === handledReview.solvedExerciseReference &&
        r.questionId === handledReview.questionId
      )
  );
};

// Get appropriate icon component based on question type
const questionIconComponent = computed(() => {
  if (currentQuestion.value.type === "SHORT_ANSWER") {
    return ShortAnswerIcon;
  } else if (currentQuestion.value.type === "MULTI_CHOICE") {
    return MultiChoiceIcon;
  } else {
    return TrueFalseIcon;
  }
});
</script>

<style scoped>
.review-list-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
  color: var(--vt-c-black);
}

.header-actions {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.back-icon {
  cursor: pointer;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}
.question-title {
  font-size: 1.5rem;
}
.question-description {
  color: var(--vt-c-grey-dark);
}
.question-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.loading,
.empty {
  text-align: center;
  color: var(--vt-c-grey-dark);
  margin-top: 2rem;
}

.reviews {
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
}
</style>
