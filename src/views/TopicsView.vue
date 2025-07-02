<script setup>
import { ref, computed, onBeforeMount } from "vue";
import { useAuthUserStore } from "@/stores/authUser";
import { useTopicStore } from "@/stores/topicStore";
import CreateTopicButton from "@/components/CreateTopicButton.vue";

import TopicItem from "@/components/TopicItem.vue";
import SearchIcon from "@/components/icons/SearchIcon.vue";
import Loading from "@/components/Loading.vue";

// Stores
const authUserStore = useAuthUserStore();
const user = authUserStore.user;
const topicStore = useTopicStore();

// Search input
const searchTerm = ref("");

// Computed topics depending on role
const topics = computed(() => {
  return user.isInstructor ? topicStore.allTopics : topicStore.topics;
});
const filteredTopics = computed(() =>
  (topics.value || []).filter((topic) =>
    topic.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
);

// Loading state
const isLoading = ref(true);

// Load data conditionally
onBeforeMount(async () => {
  const alreadyFetched =
    (user.isInstructor && topicStore.allTopics.length > 0) ||
    (!user.isInstructor && topicStore.topics.length > 0);

  if (alreadyFetched) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  try {
    await topicStore.loadTopicsForDashboard();
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <main>
    <div class="header-controls">
      <div class="search-wrapper">
        <SearchIcon class="search-icon" />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search topics"
          class="search-bar"
        />
      </div>
      <CreateTopicButton v-if="user.isInstructor" />
    </div>

    <Loading v-if="isLoading" />
    <div v-else class="grid-container">
      <TopicItem
        v-for="topic in filteredTopics"
        :key="topic.id"
        :topic="topic"
      />
    </div>
  </main>
</template>

<style scoped>
main {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.header-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 100%;
  margin-top: 1em;
  box-sizing: border-box;
}

.search-wrapper {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search-bar {
  width: 100%;
  padding: 0.7em 1em 0.7em 2.5em;
  border: 2px solid var(--vt-c-grey);
  border-radius: 15px;
  outline: none;
  font-family: inherit;
  font-size: 1rem;
}

.search-bar::placeholder {
  color: var(--vt-c-grey);
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 0.8em;
  transform: translateY(-50%);
  font-size: 1.2rem;
  color: var(--vt-c-grey);
  pointer-events: none;
}

.grid-container {
  padding-top: 1rem;
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: 20px;
  margin-top: 0;
  justify-content: center;
  margin-bottom: 2rem;
}

.grid-container > *:hover {
  cursor: pointer;
}
</style>
