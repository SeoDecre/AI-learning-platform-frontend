<template>
  <div class="question-card" :id="question.id">
    <div class="question-header">
      <!-- Question type icon -->
      <component :is="questionIconComponent" class="question-icon" />

      <div class="question-info">
        <h3 class="question-title">
          {{ index + 1 }}) {{ question.question.title }}
        </h3>
        <p class="question-description">{{ question.question.description }}</p>
      </div>
      <div></div>
    </div>

    <div class="question-content">
      <!-- MULTI_CHOICE -->
      <MultiChoiceQuestion
        v-if="question.question.type === 'MULTI_CHOICE'"
        :question="question.question"
        :model-value="modelValue"
        :review-mode="reviewMode"
        @update:modelValue="$emit('update:modelValue', $event)"
      />

      <!-- TRUE_FALSE -->
      <TrueFalseQuestion
        v-if="question.question.type === 'TRUE_FALSE'"
        :question="question.question"
        :model-value="modelValue"
        :review-mode="reviewMode"
        @update:modelValue="$emit('update:modelValue', $event)"
      />

      <!-- SHORT_ANSWER -->
      <ShortAnswerQuestion
        v-if="question.question.type === 'SHORT_ANSWER'"
        :question="question.question"
        :model-value="modelValue"
        :review-mode="reviewMode"
        @update:modelValue="$emit('update:modelValue', $event)"
      />
    </div>

    <!-- FEEDBACK (for review mode) -->
    <div v-if="reviewMode" class="feedback-container">
      <!-- Regular feedback -->
      <div class="regular-feedback-wrapper" v-if="regularFeedback">
        <FeedbackMessage :message="regularFeedback" class="regular-feedback" />
      </div>

      <!-- AI Feedback -->
      <AiFeedbackMessage
        v-if="showAIFeedback"
        :message="aiFeedback"
        :feedback-id="aiFeedbackId"
        :user-rating="store.aiFeedback[question.question.id]?.userRating"
        :ai-object="aiFeedbackObject"
        @submit-rating="handleRatingSubmit"
      />
    </div>

    <aside v-if="sidebarOpen" class="feedback-sidebar">
      <header class="sidebar-header">
        <h4>Published AI Feedback</h4>
        <button class="close-btn" @click="sidebarOpen = false">✕</button>
      </header>
      <ul class="feedback-list">
        <li
          v-for="fb in publishedAIFeedback"
          :key="fb.id"
          class="feedback-card"
        >
          <div class="card-header">
            <strong class="user-name">{{ fb.fullName }}</strong>
            <span class="rating">
              <template v-if="fb.ratingsCount">
                {{ fb.averageRating.toFixed(1) }}/5
                <small>({{ fb.ratingsCount }})</small>
              </template>
              <template v-else>No ratings yet</template>
            </span>
          </div>
          <p class="card-body">{{ fb.feedback }}</p>
          <footer class="card-footer">
            <small>Seen: {{ fb.alreadySeen ? "Yes" : "No" }}</small>
          </footer>
        </li>
      </ul>
    </aside>

    <!-- BOTTOM ACTION ROW -->
    <div class="feedback-actions-row" v-if="reviewMode">
      <!-- VIEW ALL FEEDBACKS BUTTON -->
      <CustomButton
        v-if="!userStore.user.isInstructor"
        text="View all feedbacks"
        color="black"
        :icon="FeedbackIcon"
        @click="openPublishedSidebar"
        :disabled="isAiFeedbackLoading"
      />

      <!-- AI FEEDBACK BUTTON -->
      <div
        class="centered-ai-button"
        v-if="reviewMode && !userStore.user.isInstructor && question.question.type !== 'SHORT_ANSWER'"
      >
        <CustomButton
          v-if="!isAiFeedbackLoading"
          class="ai-feedback-button"
          text="AI feedback"
          color="purple"
          :icon="AiIcon"
          @click="getAIFeedback"
        />
        <div v-else class="loading-container">
          <div class="spinner"></div>
          <span>Asking AI, please wait...</span>
        </div>
      </div>

      <!-- WEIGHT INFO -->
      <div class="bottom-right-message inline-message">
        <p class="weight-text">Weight: {{ questionWeight }}%</p>
        <p :class="scoreColorClass">Weighted score: {{ questionWeightedScore }}%</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import FeedbackMessage from "./FeedbackMessage.vue";
import MultiChoiceQuestion from "./MultiChoiceQuestion.vue";
import TrueFalseQuestion from "./TrueFalseQuestion.vue";
import ShortAnswerQuestion from "./ShortAnswerQuestion.vue";
import MultiChoiceIcon from "./icons/MultiChoiceIcon.vue";
import TrueFalseIcon from "./icons/TrueFalseIcon.vue";
import ShortAnswerIcon from "./icons/ShortAnswerIcon.vue";
import AiIcon from "./icons/AiIcon.vue";
import FeedbackIcon from "./icons/FeedbackIcon.vue";
import { computed, ref } from "vue";
import { useAuthUserStore } from "@/stores/authUser";
import CustomButton from "@/components/CustomButton.vue";
import { useExerciseAttemptStore } from "@/stores/exerciseAttempt";
import AiFeedbackMessage from "./AiFeedbackMessage.vue";

const store = useExerciseAttemptStore();
const userStore = useAuthUserStore();

const props = defineProps({
  question: Object,
  modelValue: [Array, Boolean, String],
  index: Number,
  reviewMode: Boolean,
});

const emit = defineEmits(["update:modelValue"]);

const isAiFeedbackLoading = ref(false);
const sidebarOpen = ref(false);
const publishedAIFeedback = ref([]);

const regularFeedback = computed(() => {
  const questionId = props.question?.question?.id;
  const resultMap = store.feedback?.last_attempt?.resultMap;

  if (resultMap?.[questionId]?.feedback) {
    return resultMap[questionId].feedback;
  }
  return null;
});

const aiFeedback = computed(() => {
  const questionId = props.question?.question?.id;
  return store.aiFeedback[questionId]?.feedback;
});

const showAIFeedback = computed(() => {
  return (
    aiFeedback.value &&
    aiFeedback.value !== "No AIfeedback generated yet." &&
    aiFeedback.value !== regularFeedback.value
  );
});

/**
 * Get appropriate icon component based on question type
 */
const questionIconComponent = computed(() => {
  switch (props.question.question.type) {
    case "MULTI_CHOICE":
      return MultiChoiceIcon;
    case "TRUE_FALSE":
      return TrueFalseIcon;
    default:
      return ShortAnswerIcon;
  }
});

const questionWeight = computed(() => {
  const weight = props.question.questionSlotDTO.weight;
  if (typeof weight === "number") {
    return Math.round(weight * 100).toFixed(0);
  }
  return "N/A";
});

const questionWeightedScore = computed(() => {
  const questionId = props.question?.question?.id;
  const resultMap = store.feedback?.last_attempt?.resultMap;

  if (props.reviewMode && resultMap?.[questionId]) {
    const rawScore = resultMap[questionId].score;
    if (rawScore != null) {
      return parseFloat((rawScore * 100).toFixed(2));
    }
  }
  return "N/A";
});

async function getAIFeedback(event) {
  isAiFeedbackLoading.value = true;
  event.stopPropagation();

  const exerciseId = store.exercise?.id;
  const questionId = props.question.question.id;

  if (!exerciseId) {
    console.error("No exercise loaded");
    return;
  }

  if (!questionId) {
    console.error("No question loaded");
    return;
  }
  // Call the store method that makes the API request
  await store.fetchAIQuestionFeedbackButton(exerciseId, questionId);

  isAiFeedbackLoading.value = false;
}

const handleRatingSubmit = (data, resolve, reject) => {
  store
    .submitRating({
      feedbackId: data.feedbackId,
      rating: data.rating,
    })
    .then(resolve)
    .catch(reject);
};

const aiFeedbackId = computed(() => {
  const questionId = props.question?.question?.id;
  return store.aiFeedback[questionId]?.id || null;
});

const aiFeedbackObject = computed(() => {
  const questionId = props.question?.question?.id;
  return store.aiFeedback[questionId];
});

const scoreColorClass = computed(() => {
  const score = Number(questionWeightedScore.value);
  if (isNaN(score)) return '';
  if (score <= 20) return 'score-red';
  if (score <= 50) return 'score-orange';
  if (score <= 70) return 'score-yellow';
  return 'score-green';
});

async function openPublishedSidebar() {
  isAiFeedbackLoading.value = true;
  const res = await store.fetchPublishedAIQuestionFeedback(
    store.exercise.id,
    props.question.question.id
  );
  if (res.ok)
    publishedAIFeedback.value =
      store.publishedAiFeedback[props.question.question.id];
  sidebarOpen.value = true;
  isAiFeedbackLoading.value = false;
}
</script>

<style scoped>
.question-card {
  background-color: var(--vt-c-white);
  border: 2px solid var(--vt-c-grey-light);
  border-radius: 16px;
  padding: 1rem 1rem 1rem 1rem;
  width: 100%;
  transition: 0.3s ease, transform 0.2s ease;
  position: relative;
}

.question-card:hover {
  border-color: var(--vt-c-grey);
}

.question-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.question-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.question-info {
  flex: 1;
  padding-right: 5.5rem;
}

.question-title {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.question-description {
  color: var(--vt-c-grey-dark);
  margin: 0;
}

.ai-button {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.feedback-container {
  margin-top: 1rem;
  border-top: 1px solid var(--vt-c-grey-light);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.regular-feedback-wrapper {
  display: flex;
  justify-content: center;
}

.ai-feedback-wrapper {
  display: flex;
  justify-content: flex-start;
}

.regular-feedback {
  color: var(--vt-c-black);
  padding: 1rem;
  border-radius: 8px;
  font-weight: 500;
}

.ai-feedback {
  color: var(--vt-c-purple-dark);
  padding: 1rem;
  border: 2px dotted var(--vt-c-purple-dark);
  border-radius: 8px;
  font-style: italic;
  font-weight: 400;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  width: 100%;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vt-c-purple);
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

.feedback-sidebar {
  position: absolute;
  top: 1rem;
  right: -320px;
  width: 300px;
  max-height: 320px;
  background: var(--vt-c-white);
  border: 1px solid var(--vt-c-grey-light);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  transition: right 0.3s ease;
}

.feedback-sidebar[style] {
  right: 1rem;
}
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid var(--vt-c-grey-light);
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
}
.feedback-list {
  list-style: none;
  padding: 0.5rem;
  margin: 0;
}
.feedback-card {
  background: var(--vt-c-white);
  border: 1px solid var(--vt-c-grey-light);
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.user-name {
  color: var(--vt-c-purple-dark);
  font-size: 1rem;
}
.rating {
  font-size: 0.875rem;
  color: var(--vt-c-grey-dark);
}
.card-body {
  font-size: 0.95rem;
  line-height: 1.4;
  margin-bottom: 0.5rem;
}
.card-footer {
  text-align: right;
  font-size: 0.75rem;
  color: var(--vt-c-grey-dark);
}
.ai-button-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.loading-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.feedback-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.feedback-actions-row .custom-button {
  flex-shrink: 0;
}

.inline-message {
  margin-left: auto;
  font-size: 0.9rem;
  color: var(--vt-c-grey-dark);
  text-align: right;
}

.centered-ai-button {
  display: flex;
  justify-content: center;
  flex: 1;
}

.weight-text {
  color: var(--vt-c-purple);
}

.score-red {
  color: var(--vt-c-red-dark);
}
.score-orange {
  color: var(--vt-c-orange-dark);
}
.score-yellow {
  color: var(--vt-c-yellow-dark);
}
.score-green {
  color: var(--vt-c-green-dark);
}
</style>
