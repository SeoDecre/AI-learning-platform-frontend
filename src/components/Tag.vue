<!-- 
USAGE:
    Pass content via the text prop: <Tag text="Teacher" />
    Or use slot content: <Tag>Teacher</Tag>
    Add an icon: <Tag text="Teacher" :icon="TeacherIcon" />
    Change colors: <Tag text="Expert" color="green" /> 
-->

<template>
  <div
    class="tag"
    :class="{
      'has-icon': !!icon,
      [`tag-${color}`]: true,
    }"
  >
    <span v-if="icon" class="tag-icon">
      <component :is="icon" />
    </span>
    <slot v-if="!text"></slot>
    <span v-else>{{ text }}</span>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: "",
  },
  icon: {
    type: [Object, null],
    default: null,
  },
  color: {
    type: String,
    default: "yellow",
    validator: (value) =>
      [
        "yellow",
        "green",
        "red",
        "orange",
        "blue",
        "purple",
        "grey",
        "white",
        "black",
      ].includes(value),
  },
});
</script>

<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  height: 1.5rem;
  border-radius: 7px;
  padding: 2px 6px;
  font-size: 0.8rem;
}

.tag-icon {
  margin-right: 6px;
  display: flex;
  align-items: center;
}

.tag-yellow {
  background-color: var(--vt-c-yellow);
  color: var(--vt-c-yellow-dark);
  border: 2px solid var(--vt-c-yellow-dark);
}

.tag-green {
  background-color: var(--vt-c-green);
  color: var(--vt-c-green-dark);
  border: 2px solid var(--vt-c-green-dark);
}

.tag-red {
  background-color: var(--vt-c-red);
  color: var(--vt-c-red-dark);
  border: 2px solid var(--vt-c-red-dark);
}

.tag-orange {
  background-color: var(--vt-c-orange);
  color: var(--vt-c-orange-dark);
  border: 2px solid var(--vt-c-orange-dark);
}

.tag-blue {
  background-color: var(--vt-c-blue);
  color: var(--vt-c-blue-dark);
  border: 2px solid var(--vt-c-blue-dark);
}

.tag-purple {
  background-color: var(--vt-c-purple);
  color: var(--vt-c-purple-dark);
  border: 2px solid var(--vt-c-purple-dark);
}

.tag-grey {
  background-color: var(--vt-c-grey-light);
  color: var(--vt-c-grey-dark);
  border: 2px solid var(--vt-c-grey);
}

.tag-white {
  background-color: var(--vt-c-white);
  color: color-mix(in srgb, var(--vt-c-grey), black 20%);
  border: 2px solid var(--vt-c-white);
}

.tag-black {
  background-color: var(--vt-c-black);
  color: var(--vt-c-white);
  border: 2px solid var(--vt-c-black);
}
</style>
