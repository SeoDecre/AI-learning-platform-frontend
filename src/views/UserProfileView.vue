<script setup>
import { ref, computed, onBeforeMount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTopicStore } from "@/stores/topicStore";
import Toast from "@/components/Toast.vue";
import StudentIcon from "@/components/icons/StudentIcon.vue";
import ProfessorIcon from "@/components/icons/TeacherIcon.vue";
import Tag from "@/components/Tag.vue";
import { useUserStore } from "@/stores/userStore";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const topicStore = useTopicStore();
const showToast = ref(false);
const toastMessage = ref("");

const userId = route.params.id;

onBeforeMount(async () => {
  await userStore.fetchUserById(userId);
  if (userStore.fetchError) {
    toastMessage.value = userStore.fetchError;
    showToast.value = true;
    return;
  }

  await topicStore.fetchTopicsDashboard();
});

const user = computed(() => userStore.user);

function getUserInitials(user) {
  if (!user || !user.name || !user.familyName) return "";
  return (user.name.charAt(0) + user.familyName.charAt(0)).toUpperCase();
}
</script>

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
            :color="user.isInstructor ? 'blue' : 'green'"
            :icon="user.isInstructor ? ProfessorIcon : StudentIcon"
          >
            {{ user.isInstructor ? "Professor" : "Student" }}
          </Tag>
        </div>
      </div>
      <p class="user-email">{{ user.email }}</p>
    </div>

    <div v-else class="loading">
      <p>Loading profile...</p>
    </div>
  </main>
</template>

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
}

.username {
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
}

.user-email {
  color: var(--vt-c-grey-dark);
  margin: 0.2rem 0 1rem;
}
</style>
