<template>
  <div class="topic-header">
    <h1 class="title">{{ topic.name }}</h1>
    <p class="description">{{ topic.description }}</p>
    <Tag
      class="teacher-tag"
      :text="topic.author"
      color="yellow"
      :icon="TeacherIcon"
    />

    <div class="navigation-tabs">
      <router-link
        :to="{ name: 'materials', params: { topicId: topic.id } }"
        class="tab"
        active-class="active"
      >
        Materials
      </router-link>
      <router-link
        :to="{ name: 'exercises', params: { topicId: topic.id } }"
        class="tab"
        active-class="active"
      >
        Exercises
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { useTopicStore } from "@/stores/topicStore";
import { computed } from "vue";
import TeacherIcon from "./icons/TeacherIcon.vue";

const topicStore = useTopicStore();
const topic = computed(() => topicStore.currentTopic);
</script>

<style scoped>
.topic-header {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.title {
  margin-bottom: 10px;
  color: var(--vt-c-black);
}

.description {
  color: var(--vt-c-grey-dark);
  margin-bottom: 5px;
}

.teacher-tag {
  margin-bottom: 20px;
}

.navigation-tabs {
  display: flex;
  gap: 1.5rem;
  border-bottom: 2px solid var(--vt-c-grey-light);
  padding-bottom: 0.5rem;
}

.tab {
  font-weight: bold;
  color: var(--vt-c-grey-dark);
  text-decoration: none;
  padding: 0.5rem 0;
  position: relative;
}

.tab.active {
  color: var(--vt-c-purple-dark);
}

.tab.active::after {
  content: "";
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--vt-c-purple-dark);
}
</style>
