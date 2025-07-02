<template>
  <div :class="['topic-card', { 'is-author': isAuthor }]" @click="goToTopic">
    <header class="topic-header">
      <h2 class="topic-title">{{ topic.name }}</h2>
      <EditTopicButton :topic="topic" />
    </header>

    <p class="topic-description">{{ topic.description }}</p>

    <div class="topic-meta">
      <Tag v-if="!user.isInstructor" color="black" :icon="ExerciseDoneIcon">
        <p class="exercises-count">
          {{ topic.completedExerciseCount }}/{{ topic.totalUndraftedExercises }}
        </p>
        correct exercises
      </Tag>

      <div v-if="user.isInstructor" class="average-grade">
        <span :style="{ color: gradeColor }" class="grade-value"
          >{{ averageGrade }}%</span
        >
        <span class="grade-text">average grade</span>
      </div>

      <template v-if="!user.isInstructor">
        <Tag
          v-if="topic.attemptedExerciseCount != 0"
          color="orange"
          :icon="ExerciseIcon"
        >
          {{ topic.attemptedExerciseCount }} tried exercises
        </Tag>
      </template>

      <template v-if="user.isInstructor">
        <div class="break"></div>
        <Tag color="black" :icon="UserCheckIcon">
          <p class="exercises-count">
            {{ topic.studentsCompletedAllCount }}/{{
              topic.studentsAttemptedCount
            }}
          </p>
          students passed
        </Tag>
      </template>
    </div>

    <div class="topic-progress">
      <ProgressBarStudent
        v-if="!user.isInstructor"
        :completed="topic.completedExerciseCount"
        :attempted="topic.attemptedExerciseCount"
        :total="topic.totalUndraftedExercises"
      />
    </div>

    <Tag
      class="teacher-tag"
      :color="isAuthor ? 'purple' : 'orange'"
      :icon="TeacherIcon"
      @click.stop="goToTeacherProfile"
    >
      {{ topic.authorName }} {{ topic.authorFamilyName }}
    </Tag>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { computed } from "vue";
import { useAuthUserStore } from "@/stores/authUser";
import ProgressBarStudent from "@/components/ProgressBarStudent.vue";
import EditTopicButton from "./EditTopicButton.vue";
import Tag from "@/components/Tag.vue";
import TeacherIcon from "@/components/icons/TeacherIcon.vue";
import ExerciseIcon from "@/components/icons/ExerciseIcon.vue";
import UserCheckIcon from "@/components/icons/UserCheckIcon.vue";
import ExerciseDoneIcon from "./icons/ExerciseDoneIcon.vue";
import { useUserStore } from "@/stores/userStore";
const userStore = useUserStore();

const props = defineProps({ topic: Object });
const router = useRouter();
const { user } = useAuthUserStore();

const averageGrade = computed(() =>
  Math.trunc((props.topic.averageGrade || 0) * 100)
);

const gradeColor = computed(() => {
  const val = averageGrade.value;
  if (val < 50) return "var(--vt-c-red-dark)";
  if (val < 70) return "var(--vt-c-orange-dark)";
  if (val < 85) return "var(--vt-c-yellow-dark)";
  return "var(--vt-c-green-dark)";
});

// Computed property to check if current user is the topic author
const isAuthor = computed(
  () => user.switchEduPersonUniqueId === props.topic.authorId
);

function goToTopic() {
  router.push({ name: "materials", params: { topicId: props.topic.id } });
}

// New function to navigate to teacher profile
const goToTeacherProfile = async () => {
  await userStore.fetchUserById(props.topic.authorId);
  router.push({
    name: "UserProfile",
    params: { id: props.topic.authorId },
  });
};
</script>

<style scoped>
.topic-card {
  position: relative; /* Added for absolute positioning */
  border: 2px solid var(--vt-c-grey-light);
  border-radius: 16px;
  padding: 1rem;
  padding-bottom: 2rem;
  width: 360px;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

/* Style when user is the author */
.topic-card.is-author {
  border-color: var(--vt-c-grey);
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.topic-title {
  margin: 0;
  font-size: 1.25rem;
  color: var(--vt-c-black);
}
.topic-description {
  margin-top: 0.2rem;
  margin-bottom: 1.2rem;
  color: var(--vt-c-grey-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.topic-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  margin-bottom: 0.5rem;
}
.average-grade {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  color: var(--vt-c-grey-dark);
}
.grade-value {
  font-size: 1.5rem;
}
.grade-text {
  font-size: 1rem;
}
.break {
  flex-basis: 100%;
  height: 0;
}
.topic-progress {
  margin-bottom: 1.2rem;
}
.exercises-count {
  margin-right: 5px;
  color: var(--vt-c-green);
}
.teacher-tag {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  cursor: pointer;
}
</style>
