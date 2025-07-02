<template>
  <div class="user-card-container" @click="openUser">
    <div
      class="user-avatar"
      :class="user.isInstructor ? ' professor' : ' student'"
    >
      <TeacherIcon v-if="user.isInstructor" />
      <StudentIcon v-else />
    </div>
    <p>
      {{ user.name }}
      {{ user.familyName }}
    </p>
  </div>
</template>

<script setup>
import TeacherIcon from "./icons/TeacherIcon.vue";
import StudentIcon from "./icons/StudentIcon.vue";
import { useUserStore } from "@/stores/userStore";
import { useRouter } from "vue-router";

const userStore = useUserStore();
const router = useRouter();

const props = defineProps({
  user: Object,
});

const openUser = async () => {
  await userStore.fetchUserById(props.user.switchEduPersonUniqueId);
  router.push({
    name: "UserProfile",
    params: { id: props.user.switchEduPersonUniqueId },
  });
};
</script>

<style scoped>
div.user-card-container {
  border: 2px, solid, var(--vt-c-grey-light);
  padding: 20px;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 16px;
  gap: 20px;
  margin-left: 10px;
  margin-right: 10px;
  cursor: pointer;
}

div.user-card-container:hover {
  background-color: color-mix(in srgb, var(--vt-c-grey), white 80%);
}

.professor {
  background-color: var(--vt-c-purple);
}

.student {
  background-color: var(--vt-c-orange);
}

.user-avatar {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  font-size: 1.2rem;
  margin-right: 10px;
}

p {
  color: var(--vt-c-grey-dark);
}
</style>
