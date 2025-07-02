<script setup>
import { ref, computed } from "vue";
import { useUserStore } from "@/stores/userStore";
import { useAuthUserStore } from "@/stores/authUser";
import UserCard from "@/components/UserCard.vue";
import SearchIcon from "@/components/icons/SearchIcon.vue";
const authStore = useAuthUserStore();

const currUser = authStore.user.switchEduPersonUniqueId;
const userStore = useUserStore();
const query = ref("");
const page = ref(0);
const pageSize = 15;

const onSearch = async () => {
  page.value = 0;
  await userStore.searchUsers(query.value);
};

const hasNext = computed(() => {
  const total = userStore.searchResults.length;

  return (page.value + 1) * pageSize < total;
});

const nextPage = () => {
  if (hasNext.value) {
    page.value += 1;
  }
};

const pagedResults = computed(() => {
  const start = page.value * pageSize;
  const slice = userStore.searchResults.slice(start, start + pageSize);

  return slice;
});
</script>

<template>
  <main class="lookup-page">
    <div class="search-wrapper">
      <SearchIcon class="search-icon" />
      <input
        v-model="query"
        @keyup.enter="onSearch"
        type="text"
        placeholder="Enter part of a name…"
        class="search-bar"
      />
    </div>

    <div v-if="userStore.searchError" class="error">
      {{ userStore.searchError }}
    </div>

    <ul v-if="pagedResults.length">
      <li v-for="user in pagedResults" :key="user.id">
        <UserCard
          :user="user"
          v-if="user.switchEduPersonUniqueId !== currUser"
        />
      </li>
    </ul>

    <div v-else-if="!userStore.isSearching && !userStore.searchError">
      <p>Enter a name to begin your search.</p>
    </div>

    <button
      v-if="userStore.searchResults.length && hasNext"
      @click="nextPage"
      class="next-button"
    >
      Next
    </button>
  </main>
</template>

<style scoped>
.lookup-page {
  width: 50%;
  margin: 2rem auto;
  display: flex;
  flex-direction: column;
}

.search-wrapper {
  position: relative;
  align-items: center;
  padding-left: 20%;
}

.search-bar {
  width: 70%;
  padding: 0.7em 1em 0.7em 2.5em;
  border: 2px solid var(--vt-c-grey);
  border-radius: 15px;
  outline: none;
  font-family: inherit;
  font-size: 1rem;
  margin-bottom: 2rem;
}

.search-bar::placeholder {
  color: var(--vt-c-grey);
}

.search-icon {
  position: relative;
  top: 7px;
  left: 1.8em;
  font-size: 1.2rem;
  color: var(--vt-c-grey);
  pointer-events: none;
}

.search-button {
  height: 46.5px;
}

.next-button {
  margin-top: 1rem;
  padding: 0.5em 1em;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error {
  color: var(--vt-c-red-dark);
  margin-bottom: 1rem;
}

ul {
  padding: 0;
  max-height: 60vh;
  overflow-y: auto;
  border-bottom: 2px solid var(--vt-c-grey-light);
  border-top: 2px solid var(--vt-c-grey-light);
}

li {
  color: var(--vt-c-black);
  list-style-type: none;
  margin-bottom: 5px;
  margin-top: 5px;
}
</style>
