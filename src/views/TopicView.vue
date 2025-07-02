<template>
  <div class="topic-container">
    <div v-if="loaded">
      <TopicHeader />
      <RouterView />
    </div>
    <div v-else class="loading-indicator">
      <p>Loading topic...</p>
    </div>
  </div>
</template>

<script setup>
import TopicHeader from "@/components/TopicHeader.vue";
import { onBeforeMount, onBeforeUnmount, ref } from "vue";
import { RouterView, useRoute } from "vue-router";
import { useExerciseStore } from "@/stores/exerciseStore";
import { useTopicStore } from "@/stores/topicStore";
import { useMaterialStore } from "@/stores/Material";

const materialStore = useMaterialStore();
const exerciseStore = useExerciseStore();
const topicStore = useTopicStore();

const route = useRoute();
const topicId = route.params.topicId;
const loaded = ref(false);

onBeforeMount(async () => {
  if (topicId !== topicStore.currentTopic?.id) {
    loaded.value = false;
    await topicStore.fetchTopicById(topicId);
    loaded.value = true;
  } else {
    loaded.value = true;
  }
  loaded.value = true;
});

onBeforeUnmount(() => {
  // free memory related to exercises and materials so that when a different topic is selected the exercises are fetched
  materialStore.resetMaterials();
  exerciseStore.resetExercises();
});
</script>

<style scoped>
.topic-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: 50px;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: var(--vt-c-grey-dark);
}
</style>
