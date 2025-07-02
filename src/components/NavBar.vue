<script setup>
import { computed } from "vue";
import { RouterLink, useRouter } from "vue-router";
import Logo from "./icons/Logo.vue";
import { useAuthUserStore } from "@/stores/authUser";
import TeacherIcon from "./icons/TeacherIcon.vue";
import StudentIcon from "./icons/StudentIcon.vue";
import UserSearchIcon from "./icons/UserSearchIcon.vue";

const router = useRouter();
const authUserStore = useAuthUserStore();

const isInstructor = computed(() => authUserStore.user?.isInstructor ?? false);
const userName = computed(() => authUserStore.user?.name ?? "");

const navigateToLogin = () => {
  authUserStore.logout();
  // Also I think there's no need to push login page if page content gets rendered automatically
  router.push("/login");
};

const navigateToProfile = () => {
  router.push("/profile");
};
</script>

<template>
  <nav class="navbar">
    <!-- Left side: Logo and Dashboard RouterLink -->
    <div class="left-side">
      <div class="logo">
        <Logo />
      </div>
      <RouterLink to="/topics" class="nav-link">Dashboard</RouterLink>
      <RouterLink to="/UserLookUpView" class="nav-link"
        ><UserSearchIcon
      /></RouterLink>
    </div>

    <!-- Right side: user profile and Logout button -->
    <div class="right-side">
      <div v-if="authUserStore.user" class="user-profile">
        <div class="user-avatar" @click="navigateToProfile">
          <TeacherIcon v-if="isInstructor" />
          <StudentIcon v-else />
        </div>
        <div class="user-info">
          <span class="user-name">{{ userName }}</span>
          <div class="logout-button" @click="navigateToLogin">Log out</div>
        </div>
      </div>
      <div v-else class="login-button" @click="navigateToLogin">Log in</div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100px;
  padding: 0px 50px;
  background-color: var(--navbar-color);
  color: var(--vt-c-red);
  font-size: larger;
  width: 100%;
  box-sizing: border-box;
}

.left-side {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.right-side {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  width: 80px;
  margin-right: 20px;
}

.nav-link {
  color: var(--vt-c-black);
  text-decoration: none;
  font-size: 1.5rem;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: var(--vt-c-grey-dark);
}

.logout-button {
  color: var(--vt-c-red-dark);
  background-color: var(--vt-c-red);
  border: 2px solid var(--vt-c-red-dark);
  border-radius: 7px;
  padding: 2px 8px;
  font-size: 0.8rem;
  cursor: pointer;
}

.user-profile {
  display: flex;
  align-items: center;
}

.user-avatar {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background-color: var(--vt-c-purple);
  color: var(--vt-c-purple-dark);
  font-size: 1.2rem;
  margin-right: 10px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 1.1rem;
  color: var(--vt-c-black);
}
</style>
