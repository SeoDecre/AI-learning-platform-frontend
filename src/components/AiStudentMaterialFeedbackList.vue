<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useAuthUserStore } from '@/stores/authUser';
import { useMaterialStore } from '@/stores/Material.js';
import HighlightIcon from './icons/HighlightIcon.vue';
import QuestionIcon from './icons/QuestionIcon.vue';
import ExplanationIcon from './icons/AiIcon.vue';
import TeacherIcon from "./icons/TeacherIcon.vue";

const authUserStore = useAuthUserStore();
const materialStore = useMaterialStore();

const props = defineProps({
  materialId: { type: String, required: true }
});

const emit = defineEmits(['submit-rating']);

// local loading / error
const isLoading = ref(false);
const error = ref('');

// Rating state - track ratings for each feedback
const feedbackRatings = ref(new Map());
const submittedRatings = ref(new Set());

// derive feedbacks directly from store
const feedbacks = computed(() => materialStore.feedbacks);

async function fetchFeedbacks() {
  isLoading.value = true;
  error.value = '';
  try {
    await materialStore.fetchStudentFeedbacks(props.materialId);
  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    error.value = err.message || 'Failed to fetch feedbacks';
  } finally {
    isLoading.value = false;
  }
}

const setRating = async (feedbackId, rating) => {
  if (submittedRatings.value.has(feedbackId)) {
    return;
  }

  feedbackRatings.value.set(feedbackId, rating);

  try {
    await new Promise((resolve, reject) => {
      emit('submit-rating', 
        { feedbackId: feedbackId, rating: rating },
        resolve,
        reject
      );
    });
    submittedRatings.value.add(feedbackId);
  } catch (err) {
    console.error('Failed to submit rating:', err);
    error.value = `Failed to submit rating: ${err.message}`;
  }
};

const getRating = (feedbackId) => {
  return feedbackRatings.value.get(feedbackId) || 0;
};

const isRatingSubmitted = (feedbackId) => {
  return submittedRatings.value.has(feedbackId);
};

onMounted(fetchFeedbacks);
watch(() => props.materialId, fetchFeedbacks);
</script>

<template>
  <aside v-if="authUserStore.user.isInstructor" class="ai-feedback-list">
    <div class="ai-feedback-header">
      <ExplanationIcon class="ai-feedback-icon"/>
      <h3>Student AI feedbacks</h3>
    </div>

    <div class="ai-feedback-content">
      <div v-if="isLoading" class="loading-message">
        <span class="loading-spinner"></span>
        Loading feedbacks...
      </div>
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      <div v-else-if="feedbacks.length == 0" class="empty-message">
        <div class="empty-icon">📝</div>
        <p>No AI feedback available for this material</p>
      </div>

      <div v-else class="feedback-cards">
        <div
          v-for="fb in feedbacks"
          :key="fb.id"
          class="feedback-card"
        >
          <div class="feedback-section highlighted-text">
            <HighlightIcon class="block-icon" />
            <p>{{ fb.highlightedText }}</p>
          </div>

          <div class="feedback-section student-question">
            <QuestionIcon class="block-icon" />
            <p>{{ fb.question }}</p>
          </div>
          
          <div class="feedback-section ai-explanation">
            <ExplanationIcon class="block-icon" />
            <div class="ai-explanation-content">
              <div class="ai-answer-header">
                <div class="ai-answer-label">Rate answer</div>
                <div class="ai-rating-container">
                  <div class="ai-rating-stars">
                    <template v-for="star in 5" :key="star">
                      <span 
                        class="ai-star" 
                        :class="{ 
                          'filled': star <= getRating(fb.id),
                          'disabled': isRatingSubmitted(fb.id)
                        }"
                        @click="setRating(fb.id, star)"
                      >
                        ★
                      </span>
                    </template>
                  </div>
                </div>
              </div>
              <p>{{ fb.aiExplanation }}</p>
            </div>
          </div>

          <div v-if="fb.instructorComment" class="feedback-section instructor-comment">
            <TeacherIcon class="block-icon" />
            <p>{{ fb.instructorComment }}</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.ai-feedback-list {
  position: absolute;
  width: 350px;
  top: 0;
  right: -360px;
  height: 100%;
  background-color: var(--vt-c-white);
  backdrop-filter: blur(10px);
  color: var(--vt-c-black);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-feedback-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 0.6rem 0.6rem 0.6rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.ai-feedback-icon {
  color: var(--vt-c-purple);
  font-size: 1.2rem;
}

.ai-feedback-header h3 {
  color: var(--vt-c-black);
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.ai-feedback-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.ai-feedback-content::-webkit-scrollbar {
  display: none;
}

.feedback-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feedback-card {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid var(--vt-c-grey-light);
  border-radius: 15px;
  padding: 1.25rem;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
}

.feedback-card:hover {
  background: rgba(255, 255, 255, 0.95);
}

.feedback-section {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.feedback-section:last-child {
  margin-bottom: 0;
}

.feedback-section p {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.5;
  flex: 1;
}

.block-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.1rem;
}

.highlighted-text, .student-question, .ai-explanation, .instructor-comment {
  white-space: pre-wrap;
  padding: 0.75rem;
  border-radius: 8px;
  line-height: 1.5;
  border: 2px solid;
  transition: all 0.2s ease;
  background-clip: padding-box;
}

.highlighted-text {
  background: rgba(59, 130, 246, 0.1);
  color: var(--vt-c-blue-dark);
  border-color: rgba(59, 130, 246, 0.3);
}

.student-question {
  color: var(--vt-c-grey-dark);
  background: rgba(249, 250, 251, 0.8);
  border-color: rgba(156, 163, 175, 0.3);
}

.ai-explanation {
  background: rgba(147, 51, 234, 0.1);
  color: var(--vt-c-purple-dark);
  border-color: rgba(147, 51, 234, 0.3);
}

.ai-explanation-content {
  flex: 1;
}

.ai-answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.ai-answer-label {
  color: color-mix(in srgb, var(--vt-c-grey), black 20%);
  font-style: italic;
  font-size: 0.85rem;
}

.ai-rating-container {
  display: flex;
  align-items: center;
}

.ai-rating-stars {
  display: flex;
  gap: 0.1rem;
}

.ai-star {
  font-size: 1.1rem;
  color: color-mix(in srgb, var(--vt-c-grey), black 10%);
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}

.ai-star.filled {
  color: #f59e0b;
}

.ai-star:hover:not(.disabled) {
  transform: scale(1.15);
}

.ai-star.disabled {
  cursor: default;
  opacity: 0.7;
}

.instructor-comment {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.4);
  color: var(--vt-c-red-dark);
}

.loading-message, .error-message, .empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--vt-c-grey-dark);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(5px);
}

.loading-message {
  gap: 1rem;
}

.loading-spinner {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid rgba(156, 163, 175, 0.3);
  border-radius: 50%;
  border-top-color: var(--vt-c-purple);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: var(--vt-c-red-dark);
  background: rgba(254, 226, 226, 0.8);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.empty-message {
  gap: 1rem;
}

.empty-icon {
  font-size: 2rem;
  opacity: 0.5;
}

.empty-message p {
  margin: 0;
  opacity: 0.7;
}

@media (max-width: 600px) {
  .ai-feedback-list {
    width: 300px;
    right: -310px;
  }
}
</style>