<template>
  <main>
    <Toast v-if="showToast" :message="toastMessage" type="error" />
    <div v-if="user" class="profile-container">
      <div class="user-header">
        <div class="avatar-circle">
          {{ getUserInitials(user) }}
        </div>
        <div class="user-details">
          <h1 class="username">{{ user.name }} {{ user.familyName }}</h1>
          <Tag
            :color="user.isInstructor ? 'orange' : 'purple'"
            :icon="user.isInstructor ? ProfessorIcon : StudentIcon"
          >
            {{ user.isInstructor ? "Professor" : "Student" }}
          </Tag>
        </div>
      </div>
      <p class="user-email">{{ user.email }}</p>

      <p v-if="user.isInstructor" class="user-storage-info">
        <StorageIcon
          class="storage-icon"
          :style="{ color: getStorageColor() }"
        />
        {{ formatStorage(storageUsage.usedMegaBytes) }}/{{
          formatStorage(storageUsage.maxMegaBytes)
        }}
      </p>

      <div class="topics-section">
        <div class="statistics-header">
          <h2>Statistics</h2>
          <div class="completion-summary" v-if="!isLoading">
            <span v-if="user.isInstructor">
              {{ authoredTopicsCount }} authored topics out of
              {{ totalTopicsCount }} total topics
            </span>
            <span v-else>
              {{ completedTopicsCount }} out of {{ topics.length }} topics
              completed
            </span>
          </div>
        </div>
        <Loading v-if="isLoading" />
        <div v-else class="topics-grid">
          <ProfileTopicItem
            v-for="topic in topics"
            :key="topic.id || topic._id?.$oid"
            :topic="topic"
          />
        </div>
      </div>
    </div>

    <div v-else class="loading">
      <p>Loading profile...</p>
    </div>
  </main>
</template>

<script setup>
import { onBeforeMount, computed, ref } from "vue";
import { useAuthUserStore } from "@/stores/authUser";
import { useTopicStore } from "@/stores/topicStore";
import { storeToRefs } from "pinia";

import Toast from "@/components/Toast.vue";
import StudentIcon from "@/components/icons/StudentIcon.vue";
import ProfessorIcon from "@/components/icons/TeacherIcon.vue";
import Tag from "@/components/Tag.vue";
import ProfileTopicItem from "@/components/ProfileTopicItem.vue";
import Loading from "@/components/Loading.vue";
import StorageIcon from "@/components/icons/StorageIcon.vue";

const authUserStore = useAuthUserStore();
const topicStore = useTopicStore();
const showToast = ref(false);
const toastMessage = ref("");
const topics = computed(() => {
  if (!user.value) return [];

  if (user.value.isInstructor) {
    const id = user.value.switchEduPersonUniqueId;
    return topicStore.allTopics.filter((topic) => topic.authorId === id);
  }

  return topicStore.topics;
});
const user = computed(() => authUserStore.user);
const { storageUsage } = storeToRefs(authUserStore);

const completedTopicsCount = computed(() => {
  return topics.value.filter((topic) => {
    const percentage = getCompletionPercentage(topic);
    return percentage === 100;
  }).length;
});

const authoredTopicsCount = computed(() => {
  const id = user.value?.switchEduPersonUniqueId;
  if (!id) return 0;
  return topicStore.allTopics.filter((topic) => topic.authorId === id).length;
});

const totalTopicsCount = computed(() => topicStore.allTopics.length);

// percentage used, 0–100
const storagePercentage = computed(() =>
  storageUsage.value?.maxMegaBytes > 0
    ? Math.min(
        Math.round(
          (storageUsage.value.usedMegaBytes / storageUsage.value.maxMegaBytes) *
            100
        ),
        100
      )
    : 0
);

function getStorageColor() {
  const pct = storagePercentage.value;
  if (pct < 50) return "var(--vt-c-green-dark)";
  if (pct < 80) return "var(--vt-c-orange-dark)";
  return "var(--vt-c-red-dark)";
}

function formatStorage(mb) {
  if (mb < 1000) {
    return `${mb.toFixed(2)} MB`;
  } else {
    return `${(mb / 1000).toFixed(2)} GB`;
  }
}

const isLoading = ref(true);

onBeforeMount(async () => {
  const hasData =
    (user.value.isInstructor && topicStore.instructorTopics.length > 0) ||
    (!user.value.isInstructor && topicStore.topics.length > 0);

  if (hasData) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  try {
    await topicStore.loadTopicsForProfilePage();
  } finally {
    isLoading.value = false;
  }
});

function getUserInitials(user) {
  if (!user || !user.name || !user.familyName) return "";
  return (user.name.charAt(0) + user.familyName.charAt(0)).toUpperCase();
}

function getCompletionPercentage(topic) {
  if (user.value.isInstructor) {
    const cp = topic.completionPercentage;
    return Math.round(cp);
  }

  const total = topic.totalUndraftedExercises || 0;
  const completed = topic.completedExerciseCount || 0;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

function getCompletionClass(topic) {
  const percentage = getCompletionPercentage(topic);
  if (percentage < 20) return "low-completion";
  if (percentage < 100) return "medium-completion";
  return "full-completion";
}
</script>

<style scoped>
main {
  color: var(--vt-c-black);
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-container {
  margin-top: 2rem;
  background: var(--vt-c-white);
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1.5rem;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--vt-c-purple);
  color: var(--vt-c-purple-dark);
  font-size: 2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  text-align: left;
}

.username {
  font-size: 2rem;
  font-weight: bold;
  color: var(--vt-c-black);
  margin: 0;
}

.user-email {
  color: var(--vt-c-grey-dark);
  margin: 0.2rem 0 0 0;
}

.user-storage-info {
  color: color-mix(in srgb, var(--vt-c-grey), black 20%);
  display: flex;
  align-items: center;
  gap: 0.2rem;
  margin-top: 0.5rem;
}

.topics-section {
  margin-top: 2rem;
}

.statistics-header {
  margin-bottom: 1.5rem;
  text-align: left;
}

.statistics-header h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.completion-summary {
  color: var(--vt-c-grey-dark);
  margin: 0;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.topic-card {
  border-radius: 15px;
  padding: 1.5rem;
  border: 2px solid transparent;
  background-color: var(--vt-c-white);
  transition: all 0.2s ease-in-out;
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.topic-link {
  text-decoration: none;
}

.topic-link h3 {
  color: var(--vt-c-black);
  margin: 0;
  font-size: 1.2rem;
}

.topic-link:hover h3 {
  text-decoration: underline;
}

.completion-percentage {
  font-weight: bold;
  font-size: 0.9rem;
}

.topic-grade {
  font-size: 0.9rem;
  color: var(--vt-c-grey-dark);
}

/* Status colors */
.low-completion {
  border-color: var(--vt-c-red-dark);
  background-color: var(--vt-c-red-light);
}

.medium-completion {
  border-color: var(--vt-c-yellow-dark);
  background-color: var(--vt-c-yellow);
}

.full-completion {
  border-color: var(--vt-c-green-dark);
  background-color: var(--vt-c-green);
}

.low-completion .completion-percentage {
  color: var(--vt-c-red-dark);
}

.medium-completion .completion-percentage {
  color: var(--vt-c-yellow-dark);
}

.full-completion .completion-percentage {
  color: var(--vt-c-green-dark);
}

.full-completion .topic-link h3 {
  color: var(--vt-c-green-dark);
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
}

/* For responsivness  */
@media (max-width: 900px) {
  .topics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .topics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
