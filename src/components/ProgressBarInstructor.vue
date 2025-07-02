<template>
  <div
    class="instructor-progress"
    :aria-valuenow="barPct"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div class="bar-track">
      <div
        class="bar-fill"
        :style="{ width: barPct + '%', backgroundColor: barColor }"
        :title="`Passed: ${completed} (${barPct.toFixed(1)}%)`"
      ></div>
    </div>
    <div class="stats">
      <div class="stat-item">
        <Tag color="green" text="Passed" />
        <span class="value">{{ completed }}</span>
      </div>
      <div class="stat-item">
        <Tag color="grey" text="Total" />
        <span class="value">{{ total }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import Tag from "@/components/Tag.vue";

const props = defineProps({
  completed: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
});

const barPct = computed(() =>
  props.total ? (props.completed / props.total) * 100 : 0
);
const barColor = computed(() => {
  if (props.total === 0) return "var(--vt-c-red-dark)";
  const r = barPct.value / 100;
  if (r === 0) return "var(--vt-c-red)";
  if (r <= 0.33) return "var(--vt-c-red)";
  if (r <= 0.66) return "var(--vt-c-yellow)";
  return "var(--vt-c-green)";
});
</script>

<style scoped>
.instructor-progress {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.bar-track {
  width: 100%;
  height: 16px;
  background: var(--vt-c-grey-light);
  border-radius: 8px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  transition: width 0.4s ease, background-color 0.3s ease;
}
.stats {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.value {
  font-weight: 700;
  color: var(--vt-c-grey-dark);
}
</style>
