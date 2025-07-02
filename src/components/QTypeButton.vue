<template>
  <div class="editType">
    <button @click="switchActive"></button>
    <select
      multiple
      :class="isActive ? 'active' : 'closed '"
      name="qType"
      id="qID"
    >
      <option value="MULTI_CHOICE">Multiple Choice</option>
      <option value="TRUE_FALSE">True or False</option>
      <option value="SHORT_ANSWER">Short Answer</option>
    </select>
  </div>
</template>

<script setup>
import { ref } from "vue";
/**
 * Props:
 *
 * - onSwitch(_(String) => void_): a function to be executed on button click
 */
const props = defineProps({
  onSwitch: Function,
});

const isActive = ref(false);

const switchActive = () => {
  isActive.value = !isActive.value;
};
</script>

<style scoped>
button {
  cursor: pointer;
  border: none;
  outline: none;
  color: var(--vt-c-black-soft);
  width: 30px;
  height: 30px;
  border-radius: 5px;
}

select.active {
  position: absolute;
}

select.closed {
  display: none;
}
</style>
