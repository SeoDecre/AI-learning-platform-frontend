<template>
  <div class="review-question-item">
    <div class="expanded-content">
      <div class="content-section">
        <div class="content-block">
          <div class="block-header">
            <StudentIcon class="block-icon student-icon" />
            <strong>
              {{ studentFullName }}
              <!-- scored <span class="formatted-mark">{{ formattedMark }}</span> -->
            </strong>
          </div>
        </div>
        <div class="content-block ai-feedback">
          <div class="block-header">
            <AiIcon class="block-icon ai-icon" />
            <strong>AI feedback</strong>
          </div>
          <p>{{ displayAiFeedback }}</p>
          <div v-if="!props.review.instructorComment" class="feedback-actions">
            <CustomButton
              v-if="!isCommentingFeedback"
              @click="toggleCommentBox"
              color="black"
              :icon="ChatIcon"
            >
              Add comment
            </CustomButton>
          </div>
          <!-- Publish button in top right -->
          <CustomButton
            class="publish-btn"
            @click.stop="togglePublish"
            :text="isPublished ? 'Unpublish' : 'Publish'"
            :icon="isPublished ? EyeClosedIcon : EyeIcon"
            :color="isPublished ? 'red' : 'green'"
            :disabled="isTogglingPublish"
          />
        </div>

        <div v-if="isCommentingFeedback" class="comment-input-container">
          <textarea
            v-model="commentText"
            placeholder="Comment..."
            class="comment-textarea"
          ></textarea>
          <div class="comment-actions">
            <CustomButton
              @click="submitInstructorComment"
              :icon="SaveIcon"
              color="green"
              :disabled="!commentText.trim()"
              :loading="isSavingComment"
            />
            <CustomButton
              @click="toggleCommentBox"
              :icon="CancelIcon"
              color="red"
            />
          </div>
        </div>

        <div
          v-if="props.review.instructorComment"
          class="content-block instructor-comment"
        >
          <div class="block-header">
            <TeacherIcon class="block-icon teacher-icon" />
            <strong>Instructor comment</strong>
          </div>
          <p>{{ props.review.instructorComment }}</p>
        </div>
      </div>
    </div>

    <Toast v-if="showToast" :message="toastMessage" :type="toastType" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useExerciseAttemptStore } from "../stores/exerciseAttempt";
import { useFeedbackStore } from "../stores/feedback";
import CustomButton from "./CustomButton.vue";
import StudentIcon from "./icons/StudentIcon.vue";
import TeacherIcon from "./icons/TeacherIcon.vue";
import AiIcon from "./icons/AiIcon.vue";
import SaveIcon from "./icons/SaveIcon.vue";
import CancelIcon from "./icons/DeleteIcon.vue";
import ChatIcon from "./icons/ChatIcon.vue";
import EyeIcon from "./icons/EyeIcon.vue";
import EyeClosedIcon from "./icons/EyeClosedIcon.vue";
import Toast from './Toast.vue';

const props = defineProps({
  exerciseId: {
    type: String,
    required: true,
  },
  review: {
    type: Object,
    required: true,
    default: () => ({
      id: null,
      resourceId: null,
      fullName: "",
      // mark: null,
      // questionWeight: null,
      feedback: null,
      instructorComment: null,
      published: null,
      alreadySeen: null, // Won't use this one
      averageRating: null, // ??
    }),
  },
});

const exerciseAttemptStore = useExerciseAttemptStore();
const feedbackStore = useFeedbackStore();

const isCommentingFeedback = ref(false);
const commentText = ref("");
const isChecked = ref(props.review.alreadyChecked);
const isSavingComment = ref(false);
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("error");

// Publish state
const isPublished = ref(props.review.published || false);
const isTogglingPublish = ref(false);

watch(
  () => props.review.alreadyChecked,
  (newVal) => {
    isChecked.value = newVal;
  }
);

watch(() => props.review.published, (newPublished) => {
  isPublished.value = newPublished || false;
});

const studentFullName = computed(() => {
  return `${props.review.fullName || ""}`.trim();
});

const formattedMark = computed(() => {
  return props.review.mark ? props.review.mark.toFixed(2) : "N/A";
});

const displayStudentAnswer = computed(() => {
  return (
    props.review.userAnswer ||
    props.review.studentAnswer ||
    "No answer provided"
  );
});

const displayAiFeedback = computed(() => {
  return (
    props.review.aiFeedback ||
    props.review.feedback ||
    "No AI feedback provided"
  );
});

function showErrorToast(message) {
  toastMessage.value = message;
  toastType.value = "error";
  showToast.value = true;
  setTimeout(() => (showToast.value = false), 3000);
}

function showSuccessToast(message) {
  toastMessage.value = message;
  toastType.value = 'success';
  showToast.value = true;
  setTimeout(() => showToast.value = false, 3000);
}

function toggleCommentBox() {
  isCommentingFeedback.value = !isCommentingFeedback.value;
  if (!isCommentingFeedback.value) {
    commentText.value = "";
  }
}

async function submitInstructorComment() {
  if (!commentText.value.trim()) return;

  try {
    isSavingComment.value = true;
    const feedbackId = props.review.aiFeedbackId;

    if (!feedbackId) {
      showErrorToast("Cannot add comment - missing feedback ID");
      return;
    }

    await feedbackStore.commentOnAIFeedback(feedbackId, commentText.value);

    isCommentingFeedback.value = false;
    commentText.value = "";
    showSuccessToast("Comment added successfully");
  } catch (error) {
    console.error("Error submitting comment:", error);
    showErrorToast("Failed to add comment");
  } finally {
    isSavingComment.value = false;
  }
}

async function togglePublish() {
  const feedbackId = props.review.aiFeedbackId || props.review.id;
  
  if (!feedbackId) {
    showErrorToast("No feedback ID available");
    return;
  }

  const previousState = isPublished.value;
  isPublished.value = !isPublished.value; // Optimistic update
  
  try {
    isTogglingPublish.value = true;
    
    // Using the same logic as ReviewOpenQuestionItem
    await feedbackStore.togglePublishStatus(feedbackId, previousState);
  } catch (error) {
    console.error("Error toggling publish status:", error);
    isPublished.value = previousState; // Revert on error
    showErrorToast("Failed to toggle publish status");
  } finally {
    isTogglingPublish.value = false;
  }
}
</script>

<style scoped>
.review-question-item {
  background-color: var(--vt-c-white);
  border: 2px solid var(--vt-c-grey-light);
  border-radius: 18px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  position: relative;
  transition: all 0.2s ease;
}

.review-question-item:hover {
  border-color: var(--vt-c-grey);
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.content-block {
  position: relative;
}

.content-block p {
  padding: 0.25rem 0rem;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.5;
  color: var(--vt-c-grey-dark);
}

.formatted-mark {
  color: var(--vt-c-purple-dark);
}

.ai-feedback {
  background: color-mix(in srgb, var(--vt-c-purple-light), white 60%);
  padding: 0.5rem;
  border: 2px solid var(--vt-c-purple-dark);
  border-radius: 15px;
  color: var(--vt-c-purple-dark);
}

.instructor-comment {
  background: color-mix(in srgb, var(--vt-c-red-light), white 60%);
  padding: 0.5rem;
  border: 2px solid var(--vt-c-red-dark);
  border-radius: 15px;
  color: var(--vt-c-red-dark);
}

.block-header {
  display: flex;
  align-items: end;
  gap: 0.5rem;
}

.block-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
}

.grade-icon {
  color: var(--vt-c-purple-dark);
}
.student-icon {
  color: var(--vt-c-grey-dark);
}
.ai-icon {
  color: var(--vt-c-purple-dark);
}
.teacher-icon {
  color: var(--vt-c-red-dark);
}

.feedback-actions {
  margin-top: 0.5rem;
}

.publish-btn {
  position: absolute;
  top: 0.2rem;
  right: 0.5rem;
  background-color: transparent;
  z-index: 10;
  border: none;
}

.comment-input-container {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
}

.comment-textarea {
  flex-grow: 1;
  min-height: 80px;
  padding: 0.5rem;
  border: 2px solid var(--vt-c-grey-light);
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s;
}

.comment-textarea:focus {
  outline: none;
  border-color: var(--vt-c-grey);
}

.comment-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--vt-c-purple-dark);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .comment-input-container {
    flex-direction: column;
  }

  .comment-actions {
    flex-direction: row;
    justify-content: flex-end;
  }

  .publish-btn {
    position: static;
    margin-top: 0.5rem;
  }
}
</style>