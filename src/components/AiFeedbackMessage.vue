<template>
    <div class="content-block ai-feedback">
        <div class="block-header">
            <AiIcon class="block-icon ai-icon" />
            <strong>AI feedback</strong>
        </div>
        <p>{{ props.message }}</p>

        <!-- Rating component -->
        <div class="rating-container">
            <div v-if="published" class="stats-div">
                <p>{{ ratings }} Ratings</p>
            </div>
            <div class="rating-stars">
                <template v-for="star in 5" :key="star">
                    <span
                        class="star"
                        :class="{
                            filled: star <= selectedRating,
                            disabled: isRatingSubmitted,
                        }"
                        @click="setRating(star)"
                    >
                        ★
                    </span>
                </template>
            </div>
            <div v-if="ratingError" class="rating-error">{{ ratingError }}</div>
            <div v-if="published">
                <p class="stats-div">{{ averageRating }}/5 average</p>
            </div>
        </div>
    </div>
    <div v-if="showInstructorComment" class="content-block instructor-comment">
        <div class="block-header">
            <TeacherIcon class="block-icon teacher-icon" />
            <strong>Instructor comment</strong>
        </div>
        <p>{{ instComment }}</p>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";

const props = defineProps({
    message: String,
    feedbackId: String,
    showRating: {
        type: Boolean,
        default: true,
    },
    userRating: {
        type: Number,
        default: 0,
    },
    aiObject: Object,
});

onMounted(() => {
    if (props.userRating > 0) {
        selectedRating.value = props.userRating;
        isRatingSubmitted.value = true;
    }
});

const emit = defineEmits(["submit-rating"]);

// Rating state
const selectedRating = ref(0);
const isRatingSubmitted = ref(false);
const ratingError = ref(null);
const isRatingSubmitting = ref(false);

const setRating = async (rating) => {
    if (isRatingSubmitted.value || !props.feedbackId) return;

    isRatingSubmitting.value = true;
    ratingError.value = null;
    selectedRating.value = rating;

    try {
        await new Promise((resolve, reject) => {
            emit(
                "submit-rating",
                {
                    feedbackId: props.feedbackId,
                    rating: rating,
                },
                resolve,
                reject
            );
        });
        isRatingSubmitted.value = true;
    } catch (err) {
        ratingError.value = "Failed to submit rating";
        selectedRating.value = 0;
        console.error("Rating submission failed:", err);
    } finally {
        isRatingSubmitting.value = false;
    }
};

watch(
    () => props.feedbackId,
    (newId, oldId) => {
        if (newId !== oldId) {
            selectedRating.value = 0;
            isRatingSubmitted.value = false;
        }
    }
);

const ratings = computed(() => {
    return props.aiObject?.ratingsCount;
});

const averageRating = computed(() => {
    return props.aiObject?.averageRating;
});

// if this returns true it's a mistake (set true when testing)
const published = computed(() => {
    return props.aiObject?.published;
});

const instComment = computed(() => {
        return props.aiObject?.instructorComment;
});

const showInstructorComment = computed(() => {
  console.log("Instructor comment:", instComment.value);
  return instComment.value != null && instComment.value !== "";
});
</script>

<style scoped>
.content-block p {
    padding: 0.25rem 0rem;
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.5;
    color: var(--vt-c-grey-dark);
}

.ai-feedback {
    background: color-mix(in srgb, var(--vt-c-purple-light), white 60%);
    padding: 1rem;
    border-radius: 15px;
    color: var(--vt-c-purple-dark);
    border: 2px solid var(--vt-c-purple-dark);
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

.ai-icon {
    color: var(--vt-c-purple-dark);
}

.feedback-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.rating-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.5rem;
}

.rating-stars {
    display: flex;
    gap: 0.1rem;
}

.star {
    font-size: 1.2rem;
    color: color-mix(in srgb, var(--vt-c-grey), black 10%);
    cursor: pointer;
    transition: all 0.2s;
    line-height: 1;
}

.star.filled {
    color: #f59e0b;
}

.star:hover:not(.disabled) {
    transform: scale(1.15);
}

.star.disabled {
    cursor: default;
    opacity: 0.7;
}

.rating-error {
    color: var(--vt-c-red);
    font-size: 0.8rem;
}

.stats-div {
    color: #f59e0b;
    font-style: normal;
}

.instructor-comment {
    background: color-mix(in srgb, var(--vt-c-red-light), white 60%);
    padding: 0.5rem;
    border: 2px solid var(--vt-c-red-dark);
    border-radius: 15px;
    color: var(--vt-c-red-dark);
}

.teacher-icon {
    color: var(--vt-c-red-dark);
}
</style>
