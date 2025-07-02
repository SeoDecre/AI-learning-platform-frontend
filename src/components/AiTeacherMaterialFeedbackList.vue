<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useAuthUserStore } from '@/stores/authUser';
import { useMaterialStore } from '@/stores/Material.js';
import { useFeedbackStore } from '../stores/feedback';
import CustomButton from './CustomButton.vue';
import EyeIcon from "./icons/EyeIcon.vue";
import EyeClosedIcon from "./icons/EyeClosedIcon.vue";
import HighlightIcon from './icons/HighlightIcon.vue';
import QuestionIcon from './icons/QuestionIcon.vue';
import ExplanationIcon from './icons/AiIcon.vue';
import ChatIcon from "./icons/ChatIcon.vue";
import SaveIcon from "./icons/SaveIcon.vue";
import CancelIcon from "./icons/DeleteIcon.vue";
import TeacherIcon from "./icons/TeacherIcon.vue";

const authUserStore = useAuthUserStore();
const materialStore = useMaterialStore();
const feedbackStore = useFeedbackStore();

const props = defineProps({
  materialId: { type: String, required: true }
});

// local loading / error
const isLoading = ref(false);
const error = ref('');

// comment functionality
const commentingFeedbackId = ref(null);
const commentTexts = ref({});
const savingComments = ref({});
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("error");

// derive feedbacks directly from store
const feedbacks = computed(() => materialStore.feedbacks);

async function fetchFeedbacks() {
  isLoading.value = true;
  error.value = '';
  try {
    await materialStore.fetchTeacherFeedbacks(props.materialId);
  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    error.value = err.message || 'Failed to fetch feedbacks';
  } finally {
    isLoading.value = false;
  }
}

async function togglePublish(feedbackId, currentStatus) {
  try {
    await materialStore.togglePublishStatus(feedbackId, currentStatus);
  } catch (err) {
    console.error('Error toggling publish status:', err);
  }
}

function showErrorToast(message) {
  toastMessage.value = message;
  toastType.value = "error";
  showToast.value = true;
  setTimeout(() => (showToast.value = false), 3000);
}

function toggleCommentBox(feedbackId) {
  if (commentingFeedbackId.value === feedbackId) {
    commentingFeedbackId.value = null;
    commentTexts.value[feedbackId] = "";
  } else {
    commentingFeedbackId.value = feedbackId;
    if (!commentTexts.value[feedbackId]) {
      commentTexts.value[feedbackId] = "";
    }
  }
}

async function submitInstructorComment(feedbackId) {
  const commentText = commentTexts.value[feedbackId];
  if (!commentText || !commentText.trim()) return;

  try {
    savingComments.value[feedbackId] = true;

    await feedbackStore.commentOnAIFeedback(feedbackId, commentText);

    commentingFeedbackId.value = null;
    commentTexts.value[feedbackId] = "";
    
    // Refresh feedbacks to get the updated instructor comment
    await fetchFeedbacks();
  } catch (error) {
    console.error('Error submitting comment:', error);
    showErrorToast("Failed to add comment");
  } finally {
    savingComments.value[feedbackId] = false;
  }
}

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
            <p>{{ fb.aiExplanation }}</p>
            <div class="rating">
              <span>★ {{ fb.averageRating.toFixed(1) }}</span>
            </div>
          </div>

          <div v-if="fb.instructorComment" class="feedback-section instructor-comment">
            <TeacherIcon class="block-icon" />
            <p>{{ fb.instructorComment }}</p>
          </div>

          <!-- Comment Input Box -->
          <div v-if="commentingFeedbackId === fb.id" class="comment-input-container">
            <textarea
              v-model="commentTexts[fb.id]"
              placeholder="Comment..."
              class="comment-textarea"
            ></textarea>
            <div class="comment-actions">
              <CustomButton
                @click="submitInstructorComment(fb.id)"
                :icon="SaveIcon"
                color="green"
                :disabled="!commentTexts[fb.id] || !commentTexts[fb.id].trim()"
                :loading="savingComments[fb.id]"
              />
              <CustomButton
                @click="toggleCommentBox(fb.id)"
                :icon="CancelIcon"
                color="red"
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="feedback-actions">
            <CustomButton
              @click.stop="togglePublish(fb.id, fb.published)"
              :text="fb.published ? 'Unpublish' : 'Publish'"
              :icon="fb.published ? EyeClosedIcon : EyeIcon"
              :color="fb.published ? 'red' : 'green'"
            />
            <CustomButton
              v-if="!fb.instructorComment"
              @click="toggleCommentBox(fb.id)"
              color="black"
              :icon="ChatIcon"
            >
              Add comment
            </CustomButton>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showToast" class="toast-notification" :class="toastType">
      {{ toastMessage }}
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

.ai-explanation {
  position: relative;
}

.rating {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  padding: 0.1rem 0.4rem;
  display: flex;
  align-items: center;
  font-size: 1rem;
  color: var(--vt-c-yellow);
  background-color: var(--vt-c-purple-dark);
  opacity: 0.7;
  border-radius: 7px;
}

.star-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
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

.block-header {
  display: flex;
  align-items: end;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.block-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.1rem;
}

.teacher-icon {
  color: var(--vt-c-red-dark);
}

.highlighted-text, .student-question, .ai-explanation, .instructor-comment {
  white-space: pre-wrap;
  padding: 0.75rem;
  border-radius: 13px;
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

.instructor-comment {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.4);
  color: var(--vt-c-red-dark);
}

.feedback-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.comment-input-container {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  display: flex;
  gap: 0.5rem;
}

.comment-textarea {
  flex-grow: 1;
  min-height: 80px;
  padding: 0.75rem;
  border: 2px solid rgba(156, 163, 175, 0.3);
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.9);
}

.comment-textarea:focus {
  outline: none;
  border-color: var(--vt-c-purple);
  background: rgba(255, 255, 255, 1);
}

.comment-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
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

.toast-notification {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.3s ease;
  backdrop-filter: blur(10px);
}

.toast-notification.error {
  background-color: rgba(220, 38, 38, 0.9);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 600px) {
  .ai-feedback-list {
    width: 300px;
    right: -310px;
  }

  .comment-input-container {
    flex-direction: column;
  }

  .comment-actions {
    flex-direction: row;
    justify-content: flex-end;
  }

  .feedback-actions {
    flex-direction: column;
  }
}
</style>