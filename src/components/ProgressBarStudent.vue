<template>
  <div
    class="student-progress"
    :aria-valuenow="completedPct.toFixed(1)"
    aria-valuemin="0"
    aria-valuemax="100"
    :style="{ borderColor: outerColor }"
  >
    <div class="inner-track" :style="{ backgroundColor: outerColor }">
      <div
        class="inner-bar"
        :style="{ width: completedPct + '%', backgroundColor: innerColor }"
        :title="`Done: ${completed} (${completedPct.toFixed(1)}%)`"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  completed: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
});

const completedPct = computed(() =>
  props.total ? (props.completed / props.total) * 100 : 0
);

const innerColor = computed(() =>
  props.completed > 0 ? "var(--vt-c-green)" : "var(--vt-c-grey)"
);

const outerColor = computed(() =>
  props.completed > 0 ? "var(--vt-c-green-dark)" : "var(--vt-c-grey)"
);
</script>

<style scoped>
.student-progress {
  display: flex;
  width: 100%;
  border: 4px solid;
  border-radius: 8px;
  box-sizing: border-box;
}

.inner-track {
  flex: 1;
  height: 8px;
  border-radius: 5px;
  overflow: hidden;
}

.inner-bar {
  height: 100%;
  transition: width 0.4s ease, background-color 0.3s ease;
}
</style>
