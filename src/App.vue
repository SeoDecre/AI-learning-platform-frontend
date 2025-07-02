<script setup>
import { RouterView, useRoute } from "vue-router";
import NavBar from "./components/NavBar.vue";
import { computed, onBeforeMount, watch, ref } from "vue";
import { useAuthUserStore } from "./stores/authUser";
import Toast from "./components/Toast.vue";

const route = useRoute();
const authUser = useAuthUserStore();
const showToast = ref(false);
const toastMessage = ref("");

// Detect if current page is Login Page
const isLoginPage = computed(() => route.path === "/login");

// Watch for route changes and update the body class

watch(
  () => route.path,
  () => {
    if (isLoginPage.value) {
      document.body.classList.add("login-page-body");
    } else {
      document.body.classList.remove("login-page-body");
    }

    // Show toast if redirected due to auth
    const message = sessionStorage.getItem("redirectedDueToAuth");
    if (message) {
      toastMessage.value = message;
      showToast.value = true;
      sessionStorage.removeItem("redirectedDueToAuth");

      // Auto-hide after 3 seconds
      setTimeout(() => {
        showToast.value = false;
      }, 3000);
    }
  },
  { immediate: true }
);

onBeforeMount(async () => {
  await authUser.fetchUser();
});
</script>

<template>
  <div :class="{ 'login-layout': isLoginPage, 'default-layout': !isLoginPage }">
    <NavBar v-if="!isLoginPage" />
    <div class="router-view-container">
      <p v-if="authUser.isUserLoaded === false && !isLoginPage">Loading...</p>
      <RouterView v-else />
    </div>
    <Toast v-if="showToast" :message="toastMessage" type="error" />
  </div>
</template>

<style>
.default-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.default-layout .router-view-container {
  flex: 1;
  margin-top: 126px;
}

.login-layout {
  height: 100vh;
  overflow: hidden;
}
</style>

<style scoped>
nav {
  width: 100vw;
  height: 126px;
  background-color: var(--vt-c-white);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    align-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }
}
</style>
