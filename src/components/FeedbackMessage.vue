<template>
  <div class="feedback">
    {{ props.message }}
  </div>
</template>

<script setup>
const props = defineProps({
  message: String,
});
</script>

<style scoped>
.feedback {
  padding: 0.75rem;
}
</style>
