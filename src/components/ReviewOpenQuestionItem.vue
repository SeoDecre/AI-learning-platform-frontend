<template>
  <div class="review-question-item">
    <div v-if="isChecked" class="collapsed-view">
      <div class="student-info">
        <StudentIcon class="block-icon student-icon" />
        <strong>{{ studentFullName }}</strong>
        <strong>-</strong>
        <GradeIcon class="block-icon grade-icon" />
        <span>{{ formattedMark }}</span>
      </div>
      <ChevronDownIcon class="expand-icon" @click="toggleCheck" />
    </div>

    <div v-else class="expanded-content">
      <div class="content-section">
        <div class="content-block student-answer">
          <div class="block-header">
            <StudentIcon class="block-icon student-icon" />
            <strong>{{ studentFullName }} answer</strong>
          </div>
          <p>{{ displayStudentAnswer }}</p>
        </div>
        <div class="content-block ai-feedback">
          <div class="block-header">
            <AiIcon class="block-icon ai-icon" />
            <strong>AI feedback</strong>
          </div>
          <p>{{ displayAiFeedback }}</p>
          <div class="feedback-actions">
            <CustomButton
              v-if="!isCommentingFeedback && !displayInstructorComment"
              @click="toggleCommentBox"
              color="black"
              :icon="ChatIcon"
            >
              Add comment
            </CustomButton>
          </div>
        </div>

        <div v-if="isCommentingFeedback" class="comment-input-container">
          <textarea
            v-model="commentText"
            placeholder="Comment..."
            class="comment-textarea"
          ></textarea>
          <div class="comment-actions">
            <CustomButton
              v-show="!isSavingComment"
              type="button"
              @click="submitInstructorComment"
              :icon="SaveIcon"
              color="green"
              :disabled="!commentText.trim()"
            />
            <CustomButton
              v-show="!isSavingComment"
              type="button"
              @click="toggleCommentBox"
              :icon="CancelIcon"
              color="red"
            />
            <div v-show="isSavingComment" class="loading-spinner"></div>
          </div>
        </div>

        <div v-if="displayInstructorComment" class="content-block instructor-comment">
          <div class="block-header">
            <TeacherIcon class="block-icon teacher-icon" />
            <strong>Instructor comment</strong>
          </div>
          <p>{{ displayInstructorComment }}</p>
        </div>
      </div>

      <div class="grade-section">
        <div class="grade-controls">
          <p>Grade</p>
          <input
            type="number"
            v-model.number="modifiedGradeValue"
            :placeholder="currentAiMarkOrPlaceholder"
            min="0"
            max="1"
            step="0.01"
            class="grade-input"
            @input="validateGradeInput"
          />
          <CustomButton
            v-show="isGradeChanged && !isSavingGrade"
            type="button"
            @click="submitModifiedGrade"
            :icon="SaveIcon"
            color="green"
          />
          <div v-show="isSavingGrade" class="loading-spinner"></div>
          <CollapseIcon class="toggle-check-btn" @click="toggleCheck" />
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
import GradeIcon from "./icons/EditIcon.vue";
import TeacherIcon from "./icons/TeacherIcon.vue";
import AiIcon from "./icons/AiIcon.vue";
import SaveIcon from "./icons/SaveIcon.vue";
import CollapseIcon from "./icons/CheckIcon.vue";
import ChevronDownIcon from "./icons/SearchIcon.vue";
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
      userReference: null,
      questionId: null,
      name: "",
      familyName: "",
      userAnswer: null,
      mark: null,
      questionWeight: null,
      aiFeedback: null,
      instructorComment: null,
      alreadyChecked: null,
      bestAttemptCheck: null,
      feedbackId: null,
      published: false,
    })
  }
});

const exerciseAttemptStore = useExerciseAttemptStore();
const feedbackStore = useFeedbackStore();

const modifiedGradeValue = ref(props.review.mark);
const isCommentingFeedback = ref(false);
const commentText = ref("");
const isChecked = ref(props.review.alreadyChecked);
const isSavingGrade = ref(false);
const originalMark = ref(props.review.mark);
const isSavingComment = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('error');

// Optimistic UI state for instructor comment
const optimisticInstructorComment = ref(props.review.instructorComment);

// Publish state
const isPublished = ref(props.review.published || false);
const isTogglingPublish = ref(false);

watch(
  () => props.review.mark,
  (newMark) => {
    modifiedGradeValue.value = newMark;
  }
);

watch(() => props.review.alreadyChecked, (newVal) => {
  isChecked.value = newVal;
});

watch(() => props.review.instructorComment, (newComment) => {
  optimisticInstructorComment.value = newComment;
});

watch(() => props.review.published, (newPublished) => {
  isPublished.value = newPublished || false;
});

const studentFullName = computed(() => {
  return `${props.review.name || ""} ${props.review.familyName || ""}`.trim();
});

const formattedMark = computed(() => {
  return modifiedGradeValue.value !== null
    ? modifiedGradeValue.value.toFixed(2)
    : "N/A";
});

const currentAiMarkOrPlaceholder = computed(() => {
  return typeof props.review.mark === "number"
    ? props.review.mark.toFixed(2)
    : "Enter grade";
});

const displayStudentAnswer = computed(() => {
  return (
    props.review.userAnswer ||
    props.review.studentAnswer ||
    "No answer provided"
  );
});

const displayAiFeedback = computed(() => {
  return props.review.aiFeedback || props.review.feedback || 'No AI feedback provided';
});

const displayInstructorComment = computed(() => {
  return optimisticInstructorComment.value;
});

const isGradeChanged = computed(() => {
  const orig =
    typeof originalMark.value === "number"
      ? parseFloat(originalMark.value.toFixed(2))
      : null;
  const curr =
    typeof modifiedGradeValue.value === "number"
      ? parseFloat(modifiedGradeValue.value.toFixed(2))
      : null;
  return orig !== curr && curr !== null;
});

function showErrorToast(message) {
  toastMessage.value = message;
  toastType.value = 'error';
  showToast.value = true;
  setTimeout(() => (showToast.value = false), 3000);
}

async function toggleCheck() {
  const previousState = isChecked.value;
  isChecked.value = !isChecked.value;

  try {
    await exerciseAttemptStore.switchGradeCheck({
      questionReference: props.review.questionId,
      userReference: props.review.userReference,
      bestAttemptCheck: props.review.bestAttemptCheck,
    });
  } catch (error) {
    console.error("Error toggling check:", error);
    isChecked.value = previousState;
    showErrorToast("Failed to toggle check");
  }
}

function validateGradeInput(event) {
  if (modifiedGradeValue.value < 0) {
    modifiedGradeValue.value = 0;
  } else if (modifiedGradeValue.value > 1) {
    modifiedGradeValue.value = 1;
  }

  if (
    modifiedGradeValue.value !== null &&
    modifiedGradeValue.value !== undefined
  ) {
    const valueAsString = modifiedGradeValue.value.toString();
    const decimalIndex = valueAsString.indexOf(".");
    if (decimalIndex !== -1 && valueAsString.length > decimalIndex + 3) {
      modifiedGradeValue.value = parseFloat(
        modifiedGradeValue.value.toFixed(2)
      );
    }
  }
}

async function submitModifiedGrade() {
  if (!isGradeChanged.value || typeof modifiedGradeValue.value !== "number") {
    return;
  }

  try {
    isSavingGrade.value = true;
    await exerciseAttemptStore.modifySAQGrade({
      questionReference: props.review.questionId,
      userSwitchId: props.review.userReference,
      newMark: parseFloat(modifiedGradeValue.value.toFixed(2)),
      bestAttemptCheck: props.review.bestAttemptCheck,
    });

    originalMark.value = parseFloat(modifiedGradeValue.value.toFixed(2));
  } catch (error) {
    console.error("Error modifying grade:", error);
    showErrorToast("Failed to update grade");
  } finally {
    isSavingGrade.value = false;
  }
}

function toggleCommentBox() {
  isCommentingFeedback.value = !isCommentingFeedback.value;
  if (!isCommentingFeedback.value) {
    commentText.value = "";
  }
}

async function submitInstructorComment() {
  if (!commentText.value.trim()) return;
  
  const newComment = commentText.value.trim();
  
  // Optimistic UI update
  optimisticInstructorComment.value = newComment;
  isCommentingFeedback.value = false;
  const tempCommentText = commentText.value;
  commentText.value = '';
  
  try {
    isSavingComment.value = true;

    await feedbackStore.commentOnAIFeedback(props.review.feedbackId, newComment);
  } catch (error) {
    console.error("Error submitting comment:", error);
    // Revert optimistic update on error
    optimisticInstructorComment.value = props.review.instructorComment;
    isCommentingFeedback.value = true;
    commentText.value = tempCommentText;
    showErrorToast("Failed to add comment");
  } finally {
    isSavingComment.value = false;
  }
}

async function togglePublish() {
  if (!props.review.feedbackId) {
    showErrorToast("No feedback ID available");
    return;
  }

  const previousState = isPublished.value;
  isPublished.value = !isPublished.value; // Optimistic update
  
  try {
    isTogglingPublish.value = true;
    
    // Using the same logic as AiTeacherMaterialFeedbackList
    await feedbackStore.togglePublishStatus(props.review.feedbackId, previousState);
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
.collapsed-view {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.student-info span {
  color: var(--vt-c-purple-dark);
}

.expand-icon {
  color: var(--vt-c-grey-dark);
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.review-question-item {
  background-color: var(--vt-c-white);
  border: 2px solid var(--vt-c-grey-light);
  border-radius: 20px;
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

.item-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.25rem;
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

.student-answer {
  background: color-mix(in srgb, var(--vt-c-grey), white 60%);
  padding: 0.5rem;
  border: 2px solid var(--vt-c-grey);
  border-radius: 15px;
  color: var(--vt-c-grey-dark);
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

.grade-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.grade-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-check-btn {
  margin-left: auto;
  margin-top: auto;
  color: var(--vt-c-grey-dark);
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}
.toggle-check-btn:hover {
  color: var(--vt-c-green-dark);
}

.grade-input {
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--vt-c-grey-light);
  border-radius: 10px;
  font-size: 0.9rem;
  width: 60px;
  transition: border-color 0.2s ease;
}

.grade-input:focus {
  outline: none;
  border-color: var(--vt-c-purple);
}

.loading-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--vt-c-green-dark);
  animation: spin 1s ease-in-out infinite;
  margin: 0 0.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .grade-controls {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }

  .grade-input {
    width: 100%;
  }

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

.grade-input::-webkit-outer-spin-button,
.grade-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.grade-input {
  -moz-appearance: textfield;
}
</style>
