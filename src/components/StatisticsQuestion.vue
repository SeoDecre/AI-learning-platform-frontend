<template>
  <div
    class="question-card"
    :style="cardStyle"
    :class="isNaN(percentage) ? 'no-attempts' : ''"
  >
    <div class="card-header">
      <component :is="questionIconComponent" class="question-icon" />
      <h4 class="question-title">{{ title }}</h4>
    </div>

    <div class="card-body">
      <p class="question-description">{{ description }}</p>
    </div>

    <!-- Stats -->
    <div class="question-stats" :style="{ color: textColor }">
      <span class="stat-number">{{ percentage ? percentage + "%" : 0 }}</span>
      <span class="stat-text">{{
        percentage ? "answered correctly" : "Attempts yet"
      }}</span>
    </div>

    <!-- Arrow icon, slides in on hover -->
    <ArrowRightIcon class="hover-icon" :style="{ color: textColor }" />
  </div>
</template>

<script setup>
import { defineProps, computed } from "vue";
import MultiChoiceIcon from "./icons/MultiChoiceIcon.vue";
import TrueFalseIcon from "./icons/TrueFalseIcon.vue";
import ShortAnswerIcon from "./icons/ShortAnswerIcon.vue";

const props = defineProps({
  title: String,
  description: String,
  percentage: Number,
  type: String,
});

// Determine color category based on percentage
const colorKey = computed(() => {
  const p = props.percentage;
  if (isNaN(p)) return "grey";
  if (p < 30) return "red";
  if (p < 50) return "orange";
  if (p < 80) return "yellow";
  return "green";
});

// Styles for the card border and background
const cardStyle = computed(() => ({
  position: "relative",
  border: `2px solid var(--vt-c-${colorKey.value}-dark)`,
  backgroundColor: `var(--vt-c-${colorKey.value}-light)`,
  borderRadius: "16px",
  padding: "1rem 12.5rem 1rem 1rem",
  width: "100%",
  transition: "all 0.2s ease",
}));

// Dynamic text color for stats matching the border color
const textColor = computed(() => `var(--vt-c-${colorKey.value}-dark)`);

// Get appropriate icon component based on question type
const questionIconComponent = computed(() => {
  switch (props.type) {
    case "MULTI_CHOICE":
      return MultiChoiceIcon;
    case "TRUE_FALSE":
      return TrueFalseIcon;
    default:
      return ShortAnswerIcon;
  }
});
</script>

<style scoped>
.question-card {
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.question-title {
  font-size: 1.1rem;
}
.question-description {
  margin-left: 0.25rem;
  margin-top: 0.5rem;
  color: var(--vt-c-grey-dark);
}
.question-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.question-stats {
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  transition: transform 0.2s ease;
}

.hover-icon {
  position: absolute;
  top: 50%;
  right: 1rem;
  width: 1.8rem;
  height: 1.8rem;
  transform: translate(100%, -50%);
  opacity: 0;
  transition: transform 0.2s ease, opacity 0.2s ease;
  pointer-events: none;
}

.question-card:hover .question-stats {
  transform: translate(-40px, -50%);
}
.question-card:hover .hover-icon {
  transform: translate(0, -50%);
  opacity: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
}
.stat-text {
  font-size: 1rem;
  text-align: center;
}
</style>
