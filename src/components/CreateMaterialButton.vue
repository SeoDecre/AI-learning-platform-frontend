<template>
  <div>
    <div class="material-item new-material" @click="openForm">
      <span class="material-title">
        <span class="plus-icon">+</span>
        New Material
      </span>
    </div>

    <form v-if="isOpen" @submit.prevent="handleSubmit" class="material-form">
      <button type="button" class="close-button" @click="openForm">×</button>

      <div class="newMaterial">
        <label for="title">Title:</label>
        <input
          id="title"
          type="text"
          v-model="inputTitle"
          placeholder="Enter material title..."
          required
        />
      </div>

      <div class="newMaterial">
        <label for="type">Type:</label>
        <select id="type" v-model="inputType" required>
          <option disabled value="">Select type</option>
          <option value="PDF">PDF</option>
          <option value="File">File</option>
          <option value="Link">Link</option>
          <option value="Markdown">Markdown</option>
        </select>
      </div>

      <div
        class="newMaterial"
        v-if="inputType === 'PDF' || inputType === 'File'"
      >
        <label for="file">File:</label>
        <input
          id="file"
          type="file"
          @change="(e) => (inputFile = e.target.files[0])"
          required
        />
        <div v-if="fileError" class="file-error">{{ fileError }}</div>
      </div>

      <div class="newMaterial" v-if="inputType === 'Markdown'">
        <label for="content">Content:</label>
        <textarea
          id="content"
          v-model="inputContent"
          placeholder="Enter material content..."
          rows="5"
          required
        ></textarea>
      </div>

      <div class="newMaterial" v-if="inputType === 'Link'">
        <label for="content">Content:</label>
        <input
          id="content"
          type="url"
          v-model="inputContent"
          placeholder="https://example.com"
          required
          class="field"
        />
      </div>

      <div class="newMaterial">
        <label for="draft">Draft:</label>
        <input id="draft" type="checkbox" v-model="isDraft" />
      </div>

      <button class="submitter" type="submit">Create New Material</button>
    </form>

    <Toast v-if="showToast" :message="toastMessage" :type="toastType" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useMaterialStore } from "@/stores/Material.js";
import Toast from "./Toast.vue";
// Custom error class to handle API errors with status codes
class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

const props = defineProps({
  topicId: {
    type: String,
    required: true,
  },
});

const materialStore = useMaterialStore();

const isOpen = ref(false);
const inputTitle = ref("");
const inputType = ref("PDF");
const inputContent = ref("");
const isDraft = ref(false);
const fileError = ref("");
let inputFile = null;

// Toast related refs
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("error");

const openForm = () => {
  isOpen.value = !isOpen.value;
  resetForm();
};

const resetForm = () => {
  if (!isOpen.value) {
    inputTitle.value = "";
    inputType.value = "PDF";
    inputContent.value = "";
    isDraft.value = false;
    inputFile = null;
    fileError.value = "";
  }
};

const handleFileChange = (e) => {
  const file = e.target.files[0];
  fileError.value = "";

  if (!file) {
    inputFile = null;
    return;
  }

  // Check file size (10MB limit as an example - adjust as needed)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    fileError.value = "File size exceeds maximum limit (10MB)";
    e.target.value = null;
    inputFile = null;
    return;
  }

  // Check if file has valid extension/type (can be customized based on your requirements)
  // This is a basic check and can be expanded
  if (inputType.value === "PDF" && !file.name.toLowerCase().endsWith(".pdf")) {
    fileError.value = "Please select a valid PDF file";
    e.target.value = null;
    inputFile = null;
    return;
  }

  inputFile = file;
};

const displayToast = (message, type = "error") => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;

  // Reset toast after it disappears
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

const handleSubmit = async () => {
  try {
    // Validate file is present when required
    if (
      (inputType.value === "PDF" || inputType.value === "File") &&
      !inputFile
    ) {
      fileError.value = "Please select a file";
      return;
    }

    const createDto = {
      title: inputTitle.value,
      type: inputType.value,
      content: inputContent.value,
      isDraft: isDraft.value,
    };

    // Create a custom implementation that wraps the store method to handle HTTP errors
    const createWithErrorHandling = async () => {
      try {
        const result = await materialStore.createMaterial(
          createDto,
          inputFile,
          props.topicId
        );
        if (!result) {
          throw new ApiError("Failed to create material", 500);
        }
        return result;
      } catch (error) {
        // Check if there's response text that indicates a specific error
        if (
          error.message?.includes("413") ||
          error.message?.includes("Content Too Large")
        ) {
          throw new ApiError("Content Too Large", 413);
        } else if (
          error.message?.includes("400") ||
          error.message?.includes("Invalid or missing file")
        ) {
          throw new ApiError("Invalid or missing file", 400);
        }
        throw error;
      }
    };

    const result = await createWithErrorHandling();

    if (result) {
      displayToast("Material created successfully", "success");
      inputTitle.value = "";
      inputType.value = "PDF";
      inputContent.value = "";
      isDraft.value = false;
      inputFile = null;
      fileError.value = "";
      openForm();
    }
  } catch (err) {
    console.error("Error creating material:", err);
    // Handle specific error status codes
    if (err.status === 413) {
      displayToast("File size is too large. Please upload a smaller file.");
    } else if (err.status === 400) {
      displayToast(
        "Invalid or missing file. Please check the file and try again."
      );
    } else {
      displayToast("Failed to create material. Please try again.");
    }
  }
};
</script>

<style scoped>
.material-item.new-material {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px dashed var(--vt-c-grey);
  border-radius: 10px;
  cursor: pointer;
  color: var(--vt-c-grey-dark);
  transition: all 0.2s ease;
  justify-content: center;
}

.material-item.new-material:hover {
  background-color: color-mix(in srgb, var(--vt-c-grey), white 80%);
}

.material-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: color-mix(in srgb, var(--vt-c-grey), black 20%);
}

.plus-icon {
  margin-right: 0.5rem;
  font-size: 1.4rem;
  color: var(--vt-c-purple-dark);
}

.material-form {
  position: fixed;
  background-color: var(--vt-c-white);
  display: flex;
  flex-direction: column;
  width: 30%;
  border-radius: 20px;
  padding: 30px;
  align-items: center;
  gap: 30px;
  border: 2px solid var(--vt-c-divider-dark-1);
  z-index: 2000;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
}

button.close-button {
  position: absolute;
  background-color: var(--vt-c-text-dark-2);
  font-size: x-large;
  border: 0;
  top: 20px;
  right: 15px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  padding: 0 0 4px;
}

div.newMaterial {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: large;
  align-items: start;
  width: 100%;
}

button.submitter {
  background-color: var(--purple-button);
  width: 180px;
  height: 40px;
  border-radius: 20px;
  font-weight: bold;
  color: white;
  border: none;
  cursor: pointer;
}

input[type="text"],
textarea,
select {
  border: none;
  border-bottom: 1px solid var(--input-underline-text);
  width: 100%;
}

input[type="text"],
input,
select {
  border: none;
  border-bottom: 1px solid var(--input-underline-text);
  width: 100%;
}

input[type="text"]:focus,
textarea:focus,
select:focus {
  outline: 0;
  border-bottom: 2px solid var(--input-underline-focus);
  transition: 0.1s;
}

.file-error {
  color: var(--toast-error-color);
  font-size: 0.8rem;
  margin-top: 5px;
}
</style>
