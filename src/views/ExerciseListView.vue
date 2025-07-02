<template>
  <div class="exercises-view">
    <div v-if="isLoading" class="loading">Loading exercises...</div>

    <div v-else class="exercises-container">
      <CreateExerciseButton
        v-if="isInstructor"
        :topicId="topicId"
        class="exercise-button"
      />

      <p v-if="isInstructor && exercises.length" class="info">
        Click a published exercise to see its statistics, a drafted exercise to
        continue editing it.
      </p>

      <div v-if="exercises && exercises.length > 0" class="exercise-list">
        <ExerciseItem
          v-for="exercise in exercises"
          :key="exercise.id"
          :exercise="exercise"
        />
      </div>

      <p v-else class="no-exercises">
        No exercises available for this topic yet
      </p>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { useExerciseStore } from "@/stores/exerciseStore";
import { onBeforeMount, ref } from "vue";
import { useAuthUserStore } from "@/stores/authUser";
import ExerciseItem from "@/components/ExerciseItem.vue";
import CreateExerciseButton from "@/components/CreateExerciseButton.vue";
import { storeToRefs } from "pinia";

const route = useRoute();
const exerciseStore = useExerciseStore();
const topicId = route.params.topicId;
const { exercises } = storeToRefs(exerciseStore);
const isInstructor = useAuthUserStore().user.isInstructor;
const isLoading = ref(true);

onBeforeMount(async () => {
  isLoading.value = true;
  if (exerciseStore.exercises === null) {
    await exerciseStore.fetchExercisesByTopic(topicId);
  }
  exercises.value = exerciseStore.exercises;
  isLoading.value = false;
});
</script>

<style scoped>
.exercises-view {
  padding: 1rem;
  color: var(--vt-c-black);
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.loading,
.no-exercises {
  text-align: center;
  padding: 2rem 0;
  color: var(--vt-c-grey-dark);
}

.info {
  color: color-mix(in srgb, var(--vt-c-grey), black 20%);
  text-align: center;
  margin: 10px;
}

.exercises-container {
  width: 100%;
}

.exercise-button {
  margin-bottom: 1rem;
  width: 100%;
}

.exercise-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tab-divider {
  border: none;
  border-top: 2px solid var(--attempt-btn-color);
  margin-bottom: 1.5rem;
}
</style>
