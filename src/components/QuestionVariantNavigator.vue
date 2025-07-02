<template>
  <div class="component-wrapper">
    <ArrowLeftIcon
      @click="previousVariant"
      :class="['nav-icon', { disabled: currentIndex === 0 }]"
    />

    <span class="variant-counter">{{ currentIndex + 1 }} / {{ total }}</span>

    <ArrowRightIcon
      @click="nextVariant"
      :class="['nav-icon', { disabled: currentIndex === total - 1 }]"
    />
  </div>
</template>

<script setup>
import { defineProps } from "vue";
import ArrowLeftIcon from "./icons/ArrowLeftIcon.vue";
import ArrowRightIcon from "./icons/ArrowRightIcon.vue";

const props = defineProps({
  currentIndex: Number,
  total: Number,
  onScroll: Function,
});

const previousVariant = () => {
  if (props.currentIndex > 0) props.onScroll(false);
};

const nextVariant = () => {
  if (props.currentIndex < props.total - 1) props.onScroll(true);
};
</script>

<style scoped>
.component-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-icon {
  cursor: pointer;
  width: 24px;
  height: 24px;
  transition: opacity 0.3s ease;
  color: var(--vt-c-grey-dark);
}

.nav-icon.disabled {
  opacity: 0.3;
  cursor: default;
  pointer-events: none;
}

.variant-counter {
  font-weight: 500;
  color: var(--vt-c-grey-dark);
}
</style>
