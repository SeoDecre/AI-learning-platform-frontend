<script setup>
import { onBeforeMount, ref, computed } from "vue";
import { useRoute } from "vue-router";
import MaterialItem from "../components/MaterialItem.vue";
import CreateMaterialButton from "@/components/CreateMaterialButton.vue";
import { useMaterialStore } from "@/stores/Material";
import { useAuthUserStore } from "@/stores/authUser";
import { storeToRefs } from "pinia";

const route = useRoute();
const topicId = route.params.topicId;

const materialStore = useMaterialStore();
const authUserStore = useAuthUserStore();

const isInstructor = authUserStore.user.isInstructor;
const { materials } = storeToRefs(materialStore);
const isLoading = ref(false);

onBeforeMount(async () => {
  isLoading.value = true;
  if (materials.value === null) {
    await materialStore.fetchMaterials(topicId);
  }
  isLoading.value = false;
});

const visibleMaterials = computed(() =>
  isInstructor ? materials.value : materials.value.filter((m) => !m.isDraft)
);
</script>

<template>
  <div class="materials-view">
    <div v-if="isLoading" class="loading">Loading materials...</div>

    <div v-else class="materials-container">
      <create-material-button
        v-if="isInstructor"
        :topicId="topicId"
        class="material-button"
      />

      <div v-if="visibleMaterials.length > 0" class="material-list">
        <MaterialItem
          v-for="material in visibleMaterials"
          :key="material.id"
          :material="material"
          :topicId="topicId"
        />
      </div>

      <div v-else class="no-materials">
        <p>No materials available for this topic yet</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.materials-view {
  padding: 1rem;
  color: var(--vt-c-black);
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.loading,
.no-materials {
  text-align: center;
  padding: 2rem 0;
  color: var(--vt-c-grey-dark);
}

.materials-container {
  width: 100%;
}

.material-button {
  margin-bottom: 1rem;
  width: 100%;
}

.material-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}
</style>
