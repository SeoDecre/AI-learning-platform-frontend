<template>
  <main>
    <Toast v-if="showToast" message="Page not found." type="error" />
    <div class="not-found">
      <h1>404 - Page Not Found</h1>
      <p>This page doesn't exist. Let's get you back!</p>
      <RouterLink to="/login" class="back-link">Back to Login</RouterLink>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Toast from "@/components/Toast.vue";

const showToast = ref(false);

onMounted(() => {
  showToast.value = true;
});
</script>

<style scoped>
.not-found {
  text-align: center;
  margin-top: 5rem;
  color: var(--toast-background-color);
}

.back-link {
  display: inline-block;
  margin-top: 1.5rem;
  color: var(--edit-btn-color);
  text-decoration: none;
  font-weight: bold;
}

.back-link:hover {
  text-decoration: underline;
}
</style>
