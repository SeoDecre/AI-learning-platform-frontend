<template>
  <div class="topic-card" :style="cardStyle">
    <div class="topic-header">
      <RouterLink :to="redirectRoute" class="topic-link">
        <p>{{ topic.name }}</p>
      </RouterLink>
    </div>

    <Loading
      v-if="user.isInstructor && topic.totalUndraftedExercises === undefined"
    />

    <!-- Instructor View -->
    <div v-else-if="user.isInstructor" class="statistics-content">
      <div class="stats-grid">
        <div class="stats-item">
          <BookIcon class="stats-icon" :style="{ color: textColor }" />
          <span class="stats-label" :style="{ color: textColor }"
            >Material</span
          >
          <span class="stats-value">{{ topic.materialCount }}</span>
        </div>
        <div class="stats-item">
          <ExerciseIcon class="stats-icon" :style="{ color: textColor }" />
          <span class="stats-label" :style="{ color: textColor }"
            >Exercises</span
          >
          <span class="stats-value">{{ topic.exerciseCount }}</span>
        </div>
        <div class="stats-item">
          <QuestionIcon class="stats-icon" :style="{ color: textColor }" />
          <span class="stats-label" :style="{ color: textColor }"
            >Questions</span
          >
          <span class="stats-value">{{ topic.questionCount }}</span>
        </div>
      </div>

      <div class="stats-details">
        <div class="stats-row">
          <span class="stats-label" :style="{ color: textColor }">
            <EyeClosedIcon
              class="stats-row-icon"
              :style="{ color: textColor }"
            />
            Undrafted exercises
          </span>
          <span class="stats-value">{{ topic.totalUndraftedExercises }}</span>
        </div>
        <div class="stats-row">
          <span class="stats-label" :style="{ color: textColor }">
            <UserIcon class="stats-row-icon" :style="{ color: textColor }" />
            Students attempted
          </span>
          <span class="stats-value">{{ topic.studentsAttemptedCount }}</span>
        </div>
        <div class="stats-row">
          <span class="stats-label" :style="{ color: textColor }">
            <UserCheckIcon
              class="stats-row-icon"
              :style="{ color: textColor }"
            />
            Students completed all
          </span>
          <span class="stats-value">{{ topic.studentsCompletedAllCount }}</span>
        </div>
        <div class="stats-row">
          <span class="stats-label" :style="{ color: textColor }">
            <StatisticsIcon
              class="stats-row-icon"
              :style="{ color: textColor }"
            />
            Average grade
          </span>
          <span class="stats-value">{{ (topic.averageGrade * 100).toFixed(2) }}%</span>
        </div>
      </div>
      <div class="completion-tag-container">
        <Tag color="black">{{ Number(completionPercentage) }}% completed</Tag>
      </div>
    </div>

    <!-- Student View -->
    <div v-else class="statistics-content">
      <div class="stats-grid">
        <div class="stats-item">
          <BookIcon class="stats-icon" :style="{ color: textColor }" />
          <span class="stats-label" :style="{ color: textColor }"
            >Material</span
          >
          <span class="stats-value">{{ topic.materialCount }}</span>
        </div>
        <div class="stats-item">
          <TasksIcon class="stats-icon" :style="{ color: textColor }" />
          <span class="stats-label" :style="{ color: textColor }"
            >Exercises</span
          >
          <span class="stats-value">
            {{ topic.completedExerciseCount }}/{{
              topic.totalUndraftedExercises
            }}
          </span>
        </div>
        <div class="stats-item">
          <ExerciseIcon class="stats-icon" :style="{ color: textColor }" />
          <span class="stats-label" :style="{ color: textColor }"
            >Questions</span
          >
          <span class="stats-value">{{ topic.questionCount }}</span>
        </div>
      </div>

      <div class="stats-details">
        <div class="stats-row">
          <span class="stats-label" :style="{ color: textColor }">
            <ExerciseIcon
              class="stats-row-icon"
              :style="{ color: textColor }"
            />
            Exercises attempted
          </span>
          <span class="stats-value">{{ topic.attemptedExerciseCount }}</span>
        </div>
        <div class="stats-row">
          <span class="stats-label" :style="{ color: textColor }">
            <MultiChoiceIcon
              class="stats-row-icon"
              :style="{ color: textColor }"
            />
            Grade
          </span>
          <span class="stats-value">
            {{ (topic.gradeTopic * 100).toFixed(1) }}%
          </span>
        </div>
      </div>
      <div class="completion-tag-container">
        <Tag color="black">{{ Number(completionPercentage) }}% completed</Tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { useAuthUserStore } from "@/stores/authUser";
import Loading from "@/components/Loading.vue";
import Tag from "@/components/Tag.vue";
import BookIcon from "@/components/icons/BookIcon.vue";
import TasksIcon from "@/components/icons/TaskIcon.vue";
import ExerciseIcon from "@/components/icons/ExerciseIcon.vue";
import StatisticsIcon from "@/components/icons/StatisticsIcon.vue";
import EyeClosedIcon from "./icons/EyeClosedIcon.vue";
import UserIcon from "./icons/UserIcon.vue";
import MultiChoiceIcon from "./icons/MultiChoiceIcon.vue";
import UserCheckIcon from "./icons/UserCheckIcon.vue";
import QuestionIcon from "./icons/QuestionIcon.vue";

const props = defineProps({
  topic: {
    type: Object,
    required: true,
  },
});

const authUserStore = useAuthUserStore();
const user = authUserStore.user;

// Completion percentage
const completionPercentage = computed(() => {
  if (user.isInstructor) {
    return props.topic.completionPercentage.toFixed(1);
  }
  const total = props.topic.totalUndraftedExercises || 0;
  const completed = props.topic.completedExerciseCount || 0;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
});

// Determine color category based on completion
const colorKey = computed(() => {
  const p = Number(completionPercentage.value);
  if (p < 20) return "red";
  if (p < 50) return "orange";
  if (p < 80) return "yellow";
  return "green";
});

// Styles for the card border and background
const cardStyle = computed(() => ({
  position: "relative",
  border: `2px solid var(--vt-c-${colorKey.value}-dark)`,
  backgroundColor: `var(--vt-c-${colorKey.value}-light)`,
  borderRadius: "16px",
  padding: "1rem",
  width: "100%",
  transition: "all 0.2s ease",
}));

// Dynamic text color matching the border
const textColor = computed(() => `var(--vt-c-${colorKey.value}-dark)`);

const redirectRoute = computed(() => ({
  name: "materials",
  params: { topicId: props.topic.id || props.topic._id?.$oid },
}));
</script>

<style scoped>
.topic-card {
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 220px;
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
}

.topic-link {
  text-decoration: none;
  font-size: 1.15rem;
  display: -webkit-box;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.statistics-content {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 8px;
}

.stats-icon {
  font-size: 1.2rem;
  margin-bottom: 0.25rem;
}

.stats-label {
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
}

.stats-value {
  font-size: 0.9rem;
}

.stats-details {
  padding: 0.5rem;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.stats-row:last-child {
  border-bottom: none;
}

.stats-row-icon {
  margin-right: 0.5rem;
  font-size: 0.8rem;
}

.completion-tag-container {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
}
</style>
