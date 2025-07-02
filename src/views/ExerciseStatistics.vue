<script setup>
import { useRoute, useRouter } from "vue-router";
import { computed, onBeforeMount, onBeforeUnmount, ref } from "vue";
import QuestionGroupFeedback from "@/components/QuestionGroupFeedback.vue";
import Tag from "@/components/Tag.vue";
import CircleProgress from "@/components/CircleProgress.vue";
import StudentIcon from "@/components/icons/StudentIcon.vue";
import AttemptIcon from "@/components/icons/AttemptIcon.vue";
import { useExerciseAttemptStore } from "@/stores/exerciseAttempt";

const router = useRouter();
const route = useRoute();
const isLoading = ref(true);

const goBack = () => {
  if (isLoading.value) return;
  router.push(`/topic/${route.params.topicId}/exercises`);
};

const store = useExerciseAttemptStore();

onBeforeMount(async () => {
  isLoading.value = true;
  const id = route.params.exerciseId;
  try {
    await store.fetchFullExercise(id);
    await store.fetchExerciseStatistics(id);
  } finally {
    isLoading.value = false;
  }
});

onBeforeUnmount(() => store.clearStore());

function getPercent(v) {
  return v != null ? Math.round(v * 100) : 0;
}

const avg = computed(() => getPercent(store.stats?.averageScore));
const median = computed(() => getPercent(store.stats?.medianScore));
const iqr = computed(() => getPercent(store.stats?.iqrScore));
const stddev = computed(() => getPercent(store.stats?.standardDeviationScore));
const statsMap = computed(() => store.stats?.perQuestionAverageScores);

// Prepare tags: students and attempts
const tags = computed(() => [
  {
    value: store.stats?.totalStudents || 0,
    label: "students",
    color: "purple",
    icon: StudentIcon,
  },
  {
    value: store.stats?.totalAttempts || 0,
    label: "total attempts",
    color: "grey",
    icon: AttemptIcon,
  },
]);
</script>

<template>
  <div class="statistics-view">
    <div v-if="store.exercise && !isLoading" class="container">
      <!-- Header -->
      <div class="header-actions">
        <BackArrow @click="goBack" class="back-icon" />
      </div>
      <div class="exercise-info">
        <h1 class="title">{{ store.exercise.title }}</h1>
        <p class="description">{{ store.exercise.description }}</p>
      </div>

      <!-- Overview Tags -->
      <div class="overview-tags">
        <Tag
          v-for="(t, i) in tags"
          :key="i"
          :text="`${t.value} ${t.label}`"
          :color="t.color"
          :icon="t.icon"
        />
      </div>

      <!-- Detailed Metrics -->
      <div class="details-grid">
        <!-- Average Score as Circle -->
        <div class="circle-item">
          <CircleProgress :percentage="avg" size="80px" />
          <div class="circle-label">average</div>
        </div>
        <!-- Median, IQR, Std Dev as circles -->
        <div class="circle-item">
          <CircleProgress
            :percentage="median"
            size="80px"
            :isStatistic="false"
          />
          <div class="circle-label">median</div>
        </div>
        <div class="circle-item">
          <CircleProgress :percentage="iqr" size="80px" :isStatistic="false" />
          <div class="circle-label">IQR</div>
        </div>
        <div class="circle-item">
          <CircleProgress
            :percentage="stddev"
            size="80px"
            :isStatistic="false"
          />
          <div class="circle-label">std dev</div>
        </div>
      </div>

      <!-- Question Performance -->
      <div class="stats-section">
        <h2 class="section-title">Question performance</h2>
        <div class="questions-list">
          <QuestionGroupFeedback
            v-for="q in store.questions"
            :key="q.id"
            class="question-wrapper"
            :questions="q.questions"
            :statsMap="statsMap"
          ></QuestionGroupFeedback>
        </div>
        <p class="no-questions-text" v-if="store.questions.length == 0">
          No questions
        </p>
      </div>
    </div>

    <div v-else-if="isLoading" class="loading">
      <p>Loading statistics...</p>
    </div>

    <div v-else class="error">
      <p>No statistics available.</p>
    </div>
  </div>
</template>

<style scoped>
.statistics-view {
  color: var(--vt-c-black);
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 1rem;
}
.container {
  max-width: 800px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.header-actions {
  display: flex;
  align-items: center;
}
.back-icon {
  cursor: pointer;
}
.exercise-info .title {
  font-size: 1.75rem;
  margin: 0.5rem 0;
}
.exercise-info .description {
  font-size: 1rem;
  color: var(--vt-c-grey-dark);
}
.overview-tags {
  display: flex;
  gap: 0.75rem;
}
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 1rem;
  align-items: center;
}
.circle-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.circle-label {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--vt-c-grey-dark);
}
.stats-section .section-title {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.loading,
.error {
  text-align: center;
  color: var(--vt-c-grey-dark);
  width: 100%;
}
.no-questions-text {
  color: color-mix(in srgb, var(--vt-c-grey), black 20%);
}

.question-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
</style>
