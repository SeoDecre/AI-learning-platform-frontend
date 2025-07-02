<template>
  <div>
    <StatisticsQuestion
      v-for="q in questions"
      :title="q.title"
      :description="q.description"
      :percentage="statsMap[q.id] * 100"
      :type="q.type"
      @click="reviewQuestion(q.id)"
    />
  </div>
</template>

<script setup>
import StatisticsQuestion from "./StatisticsQuestion.vue";
import { useRouter, useRoute } from "vue-router";
import { useExerciseAttemptStore } from "@/stores/exerciseAttempt";

const props = defineProps({
  questions: Array,
  statsMap: Object,
});

const router = useRouter();
const route = useRoute();
const store = useExerciseAttemptStore();

function reviewQuestion(questionId) {
  router.push({
    name: "ExerciseAnswerFeedbacksList",
    params: {
      topicId: route.params.topicId,
      exerciseId: store.exercise.id,
    },
    query: { questionId },
  });
}
</script>

<style scoped>
div {
  display: flex;
  flex-direction: column;
}
</style>
