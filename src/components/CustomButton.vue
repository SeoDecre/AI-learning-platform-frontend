<!-- 
USAGE:
    Basic usage: <CustomButton text="Create Topic" />
    With an icon: <CustomButton text="Create Topic" :icon="PlusIcon" />
    Different color: <CustomButton text="Delete" color="red" />
    Custom size: <CustomButton text="Save" size="small" />
    Using slots: <CustomButton>Custom Content</CustomButton>
    Disabling it: <CustomButton disabled=true />
-->

<template>
  <button
    class="custom-button"
    :class="{
      'has-icon': !!icon,
      [`button-${color}`]: true,
      [`button-${size}`]: true,
      'button-disabled': disabled,
    }"
    :disabled="disabled"
    @click="handleClick"
  >
    <span v-if="icon" class="button-icon">
      <component :is="icon" />
    </span>
    <slot v-if="!text"></slot>
    <span v-else>{{ text }}</span>
  </button>
</template>

<script setup>
const props = defineProps({
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
    default: "blue",
    validator: (value) =>
      ["blue", "green", "red", "orange", "yellow", "purple", "grey", "black"].includes(
        value
      ),
  },
  size: {
    type: String,
    default: "medium",
    validator: (value) => ["small", "medium", "large"].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["click"]);

function handleClick(event) {
  if (!props.disabled) {
    emit("click", event);
  }
}
</script>

<style scoped>
.custom-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  border: 2px solid;
  gap: 5px;
}

.custom-button:disabled {
  background-color: var(--vt-c-grey-light);
  color: color-mix(in srgb, var(--vt-c-grey), black 30%);
  border-color: var(--vt-c-grey);
  cursor: not-allowed;
}

.button-disabled {
  cursor: not-allowed;
  pointer-events: none;
}

.button-icon {
  display: flex;
  align-items: center;
}

/* Size variations */
.button-small {
  height: 1.5rem;
  padding: 0 8px;
  font-size: 0.8rem;
}

.button-medium {
  height: 2rem;
  padding: 0 6px;
  font-size: 0.9rem;
}

.button-large {
  height: 2.5rem;
  padding: 0 16px;
  font-size: 1rem;
}

/* Color variations */
.button-blue {
  background-color: var(--vt-c-blue);
  color: var(--vt-c-blue-dark);
  border-color: var(--vt-c-blue-dark);
}

.button-green {
  background-color: var(--vt-c-green);
  color: var(--vt-c-green-dark);
  border-color: var(--vt-c-green-dark);
}

.button-red {
  background-color: var(--vt-c-red);
  color: var(--vt-c-red-dark);
  border-color: var(--vt-c-red-dark);
}

.button-orange {
  background-color: var(--vt-c-orange);
  color: var(--vt-c-orange-dark);
  border-color: var(--vt-c-orange-dark);
}

.button-yellow {
  background-color: var(--vt-c-yellow);
  color: var(--vt-c-yellow-dark);
  border-color: var(--vt-c-yellow-dark);
}

.button-purple {
  background-color: var(--vt-c-purple);
  color: var(--vt-c-purple-dark);
  border-color: var(--vt-c-purple-dark);
}

.button-grey {
  background-color: var(--vt-c-grey-light);
  color: var(--vt-c-grey-dark);
  border-color: var(--vt-c-grey);
}

.button-black {
  background-color: var(--vt-c-black);
  color: var(--vt-c-white);
  border-color: var(--vt-c-black);
}
</style>
