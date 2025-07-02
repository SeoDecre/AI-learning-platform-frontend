<template>
  <div class="stat-circle-container" :style="containerStyle">
    <svg class="stat-circle" viewBox="0 0 20 20">
      <circle class="background" cx="10" cy="10" :r="radius" />
      <circle
        class="progress"
        cx="10"
        cy="10"
        :r="radius"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
      />
      <text
        x="10"
        y="11.5"
        class="percentage-text"
        :class="{ 'small-text': percentage > 99 }"
      >
        {{ percentage }}{{ isStatistic ? "%" : "" }}
      </text>
    </svg>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  percentage: {
    type: Number,
    required: true,
    validator: (value) => value >= 0 && value <= 100,
  },
  size: {
    type: String,
    default: "100%",
    validator: (value) =>
      value.endsWith("px") || value.endsWith("%") || value.endsWith("rem"),
  },
  strokeWidth: {
    type: Number,
    default: 1.5,
  },
  isStatistic: {
    type: Boolean,
    default: true,
  },
});

const radius = 8;
const circumference = 2 * Math.PI * radius;

const dashOffset = computed(() => circumference * (1 - props.percentage / 100));

const containerStyle = computed(() => ({
  width: props.size,
  "--circle-stroke-width": `${props.strokeWidth}px`,
}));
</script>

<style scoped>
.stat-circle-container {
  display: inline-block;
  aspect-ratio: 1;
}

.stat-circle {
  transform: rotate(-90deg);
}

.background {
  fill: none;
  stroke: var(--vt-c-green-dark);
  stroke-width: 3;
}

.progress {
  fill: none;
  stroke: var(--vt-c-green);
  stroke-width: 1.5;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.4s ease-out;
  animation: fadeIn 0.5s ease-out;
}

.percentage-text {
  font-size: 5px;
  text-anchor: middle;
  font-weight: bold;
  transform: rotate(90deg);
  transform-origin: 10px 10px;
  fill: var(--text-color, currentColor);
}

/* Optional: Handle long percentages better */
.small-text {
  font-size: 4px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
