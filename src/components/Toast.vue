<template>
  <div v-if="visible" :class="['toast', type]">
    {{ message }}
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  message: String,
  type: { type: String, default: "error" },
});

const visible = ref(true);

onMounted(() => {
  setTimeout(() => {
    visible.value = false;
  }, 3000);
});
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: var(--toast-background-color);
  padding: 10px 20px;
  color: var(--toast-color);
  border-radius: 5px;
  z-index: 9999;
  animation: fadeInOut 3s ease-in-out;
}

.toast.success {
  background-color: var(--toast-succ-color);
}

.toast.error {
  background-color: var(--toast-error-color);
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  10%,
  90% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
}
</style>
