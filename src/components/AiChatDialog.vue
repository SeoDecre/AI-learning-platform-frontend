<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  selectedText: {
    type: String,
    default: ''
  },
  isOpen: {
    type: Boolean,
    default: false
  },
  materialId: {
    type: String,
    required: true
  },
});

const emit = defineEmits(['close', 'ask-question', 'submit-rating']);

const userQuestion = ref('');
const aiAnswer = ref('');
const isLoading = ref(false);
const aiError = ref('');
const MAX_QUESTION_LENGTH = 300;
const feedbackId = ref(null);
const selectedRating = ref(0);
const isRatingSubmitted = ref(false);
const requestCounter = ref(0);

watch(() => props.isOpen, (value) => {
  if (!value) {
    requestCounter.value++;
    userQuestion.value = '';
    aiAnswer.value = '';
    aiError.value = '';
    feedbackId.value = null;
    selectedRating.value = 0;
    isRatingSubmitted.value = false;
    isLoading.value = false;
    emit('loading', false);
  }
});

const askQuestion = async () => {
  if (!props.selectedText || !userQuestion.value) {
    aiError.value = 'Please highlight some text and type a question.';
    return;
  }

  // Bump counter and capture this request's ID
  const myRequestId = ++requestCounter.value;

  isLoading.value = true;
  emit('loading', true);
  aiError.value = '';
  isRatingSubmitted.value = false;
  selectedRating.value = 0;

  try {
    const [answer, responseFeedbackId] = await new Promise((resolve, reject) => {
      emit('ask-question',
        { highlightedText: props.selectedText, question: userQuestion.value },
        resolve,
        reject
      );
    });

    // If another ask fired or dialog closed, ignore this result
    if (myRequestId !== requestCounter.value) return;

    aiAnswer.value = answer;
    feedbackId.value = responseFeedbackId;
  } catch (err) {
    aiError.value = `Failed to get answer`;
  } finally {
    // Only clear loading if still the latest
    if (myRequestId === requestCounter.value) {
      isLoading.value = false;
      emit('loading', false);
    }
  }
};

const handleClose = () => {
  emit('close');
};

const setRating = async (rating) => {
  if (isRatingSubmitted.value || !feedbackId.value) {
    return;
  }

  selectedRating.value = rating;

  try {
    await new Promise((resolve, reject) => {
      emit('submit-rating', 
        { feedbackId: feedbackId.value, rating: rating },
        resolve,
        reject
      );
    });
    isRatingSubmitted.value = true;
  } catch (err) {
    aiError.value = `Failed to submit rating: ${err.message}`;
  }
};
</script>

<template>
  <aside class="ai-chat-dialog" :class="{ open: isOpen }">
    <div class="ai-chat-header">
      <AiIcon class="ai-chat-icon"/>
      <h3>Ask our AI model</h3>
      <button class="close-button" @click="handleClose">×</button>
    </div>
    
    <div class="ai-chat-content">
      <div v-if="selectedText" class="ai-selected-text-container">
        <div class="ai-selected-text">{{ selectedText }}</div>
      </div>
      
      <div class="ai-question-container">
        <textarea 
          v-model="userQuestion" 
          placeholder="Ask a question about this text..."
          rows="3"
          maxlength="300"
          :disabled="isLoading"
        ></textarea>
        <div class="character-count" :class="{ 'near-limit': userQuestion.length > MAX_QUESTION_LENGTH * 0.8 }">
          {{ userQuestion.length }}/{{ MAX_QUESTION_LENGTH }}
        </div>
      </div>

      <div class="action-row">
        <button
          class="ai-ask-button"
          @click="askQuestion"
          :disabled="isLoading || !selectedText || !userQuestion"
          :class="{ loading: isLoading }"
        >
          <AiIcon class="ai-send-icon" />
        </button>
      </div>
      
      <div v-if="aiError" class="ai-error-message">
        {{ aiError }}
      </div>
      
      <div v-if="aiAnswer && !isLoading" class="ai-answer-container">
        <div class="ai-answer-header">
          <div class="ai-answer-label">Rate answer</div>
          <div class="ai-rating-container">
            <div class="ai-rating-stars">
              <template v-for="star in 5" :key="star">
                <span 
                  class="ai-star" 
                  :class="{ 
                    'filled': star <= selectedRating,
                    'disabled': isRatingSubmitted
                  }"
                  @click="setRating(star)"
                >
                  ★
                </span>
              </template>
            </div>
          </div>
        </div>
        <div class="ai-answer">{{ aiAnswer }}</div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.ai-chat-dialog {
  position: absolute;
  width: 350px;
  top: 0;
  right: -360px;
  height: 100%;
  background-color: var(--vt-c-white);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  transform: translateX(100vh);
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.ai-chat-dialog.open {
  transform: translateX(0);
}

.ai-chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
}

.ai-chat-icon {
  width: 28px;
  height: 28px;
  color: var(--vt-c-purple);
}

.ai-chat-header h3 {
  cursor: default;
  user-select: none;
  color: var(--vt-c-grey-dark);
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--vt-c-grey-dark);
  padding: 0.25rem;
  transition: color 0.2s;
}

.close-button:hover {
  color: var(--vt-c-purple);
}

.ai-chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  overflow-y: auto;
}

.ai-selected-text {
  font-style: italic;
  white-space: pre-wrap;
  max-height: 120px;
  overflow-y: auto;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid var(--vt-c-grey-light);
  color: var(--vt-c-grey-dark);
  font-size: 0.9rem;
  line-height: 1.4;
}

.ai-question-container {
  position: relative;
}

.ai-question-container textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--vt-c-grey-light);
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
  font-size: 0.95rem;
  transition: all 0.2s;
  background: white;
  min-height: 80px;
}

.ai-question-container textarea:focus {
  border-color: var(--vt-c-purple);
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.character-count {
  position: absolute;
  bottom: 0.5rem;
  right: 0.75rem;
  font-size: 0.75rem;
  color: var(--vt-c-grey-dark);
  background: rgba(255,255,255,0.9);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
}

.character-count.near-limit {
  color: var(--vt-c-red);
}

.action-row {
  display: flex;
  justify-content: center;
  align-items: center;
}

.ai-ask-button {
  position: relative;
  background: var(--vt-c-black);
  border: none;
  width: 4rem;
  height: 2rem;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -10px;
  transition: all 0.2s;
}

/* .ai-ask-button.loading::before {
  content: "";
  position: absolute;
  top: -5px;
  left: 15px;
  right: 15px;
  bottom: -5px;
  border-radius: inherit;
  background: conic-gradient(
    var(--vt-c-red),
    var(--vt-c-orange),
    var(--vt-c-yellow),
    var(--vt-c-green),
    var(--vt-c-blue),
    var(--vt-c-purple),
    var(--vt-c-pink),
    var(--vt-c-red)
  );
  filter: blur(10px);
  animation: spinGradient 2.5s linear infinite;
  z-index: -1;
}

@keyframes spinGradient {
  to { transform: rotate(360deg); }
} */

.ai-ask-button:disabled {
  cursor: not-allowed;
  background: var(--vt-c-grey-dark);
}

.ai-send-icon {
  color: var(--vt-c-white);
  font-size: 1rem;
  transition: transform 0.2s;
}

.ai-ask-button:hover:not(.loading):not(:disabled) .ai-send-icon {
  transform: scale(1.1);
}

@keyframes aiColorCycle {
  0%   { color: var(--vt-c-red); }
  25%  { color: var(--vt-c-yellow); }
  50%  { color: var(--vt-c-green); }
  75%  { color: var(--vt-c-blue); }
  100% { color: var(--vt-c-purple); }
}

.ai-ask-button.loading {
  background: var(--vt-c-black);
}

.ai-ask-button.loading .ai-send-icon {
  animation: aiColorCycle 2s linear infinite;
  transform: none;
}

.ai-error-message {
  color: var(--vt-c-red-dark);
  padding: 0.75rem;
  background-color: #fee2e2;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.ai-answer-container {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
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
}

.ai-answer {
  white-space: pre-wrap;
  line-height: 1.4;
  color: var(--vt-c-grey-dark);
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
  font-size: 1.2rem;
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

@media (max-width: 480px) {
  .ai-chat-dialog {
    width: 100%;
    right: -100%;
  }
}
</style>
