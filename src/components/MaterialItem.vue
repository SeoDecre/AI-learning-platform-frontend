<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import MarkdownIt from "markdown-it";
import { useAuthUserStore } from "@/stores/authUser";
import { useMaterialStore } from "@/stores/Material.js";
import Markdownicon from "./icons/Markdown.vue";
import Pdficon from "./icons/Pdf.vue";
import Linkicon from "./icons/Link.vue";
import FileIcon from "./icons/File.vue";
import EditMaterials from "./EditMaterials.vue";
import EditIcon from "./icons/EditIcon.vue";
import DeleteIcon from "./icons/DeleteIcon.vue";
import Tag from "./Tag.vue";
import MoreIcon from "./icons/MoreIcon.vue";
import UploadIcon from "./icons/UploadIcon.vue";
import UpdateIcon from "./icons/UpdateIcon.vue";
import AiChatDialog from "./AiChatDialog.vue";
import AiTeacherMaterialFeedbackList from "./AiTeacherMaterialFeedbackList.vue";
import AiStudentMaterialFeedbackList from "./AiStudentMaterialFeedbackList.vue";

// Stores
const authUserStore = useAuthUserStore();
const materialStore = useMaterialStore();

// Props
const props = defineProps({
  material: { type: Object, required: true },
  topicId: { type: String, required: true },
});

// UI Refs & States
const showEditOverlay = ref(false);
const showMenu = ref(false);
const showFullMarkdown = ref(false);
const showPdfViewer = ref(false);
const pdfViewerUrl = ref("");
const menuRef = ref(null);
const menuButtonRef = ref(null);

// AI Refs & States
const selectedText = ref("");
const aiAnswer = ref("");
const showAiChatDialog = ref(false);
const aiTooltipVisible = ref(false);
const isAiLoading = ref(false);

// Roles
const isInstructor = computed(() => authUserStore.user.isInstructor);

// Markdown preview
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
const renderedMarkdown = computed(() => {
  if (props.material.type !== "Markdown") return null;
  const content = props.material.content || "";
  return md.render(content.slice(0, 200) + (content.length > 200 ? "..." : ""));
});

// Icons & Dates
const materialIcon = computed(
  () =>
    ({
      PDF: Pdficon,
      Link: Linkicon,
      Markdown: Markdownicon,
    }[props.material.type] || FileIcon)
);

function formatDate(arr) {
  if (!Array.isArray(arr) || arr.length < 6) return "";
  const [y, m, d, h, min, s, n = 0] = arr;
  const date = new Date(y, m - 1, d, h, min, s, Math.floor(n / 1e6));
  return `${date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })} at ${date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

const formattedUploadDate = computed(() =>
  formatDate(props.material.uploadDate)
);
const formattedLastUpdated = computed(() =>
  formatDate(props.material.lastUpdated)
);
const isLastUpdatedSameAsUpload = computed(
  () =>
    JSON.stringify(props.material.uploadDate) ===
    JSON.stringify(props.material.lastUpdated)
);

// Menu logic
const toggleMenu = (e) => {
  e.stopPropagation();
  showMenu.value = !showMenu.value;
};
const closeMenuOnOutsideClick = (e) => {
  if (
    showMenu.value &&
    !menuRef.value?.contains(e.target) &&
    !menuButtonRef.value?.contains(e.target)
  )
    showMenu.value = false;
};

// Material actions
const openEditOverlay = (e) => {
  e.stopPropagation();
  showEditOverlay.value = true;
  showMenu.value = false;
};
const closeEditOverlay = () => (showEditOverlay.value = false);
const deleteMaterial = (e) => {
  e.stopPropagation();
  materialStore.deleteMaterial(props.material.id);
  showMenu.value = false;
};

const toggleMarkdownPopup = () =>
  (showFullMarkdown.value = !showFullMarkdown.value);

const openPdfViewer = (url) => {
  pdfViewerUrl.value = url;
  showPdfViewer.value = true;
};
const closePdfViewer = () => (showPdfViewer.value = false);

const downloadFile = () => {
  const link = document.createElement("a");
  link.href = `http://localhost:8080/api/materials/${props.material.id}/download`;
  link.setAttribute("download", props.material.title);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Material card click
const handleMaterialClick = () => {
  if (showMenu.value) return;
  const { type, content, id } = props.material;
  if (type === "PDF")
    openPdfViewer(`http://localhost:8080/api/materials/${id}/render`);
  else if (type === "File") downloadFile();
  else if (type === "Link") window.open(content, "_blank");
  else if (type === "Markdown") toggleMarkdownPopup();
};

// AI Tooltip and Chat Dialog logic
const handleTextSelection = () => {
  // Don't capture text selection when AI question overlay is open
  if (!showFullMarkdown.value || showAiChatDialog.value) return;

  const selection = window.getSelection();
  const selectedStr = selection?.toString().trim() || "";

  if (selectedStr.length >= 2) {
    // Only show for meaningful selections
    // Store the selection text immediately when it happens
    selectedText.value = selectedStr;

    // Show the AI tooltip when text is selected
    aiTooltipVisible.value = true;
  } else {
    // Don't hide tooltip on empty selection
    // We'll keep it visible in the markdown modal
  }
};

const hideAITooltip = () => {
  if (!showFullMarkdown.value) aiTooltipVisible.value = false;
};

const openAiChatDialog = (e) => {
  e?.preventDefault();
  e?.stopPropagation();
  selectedText.value =
    window.getSelection()?.toString().trim() || selectedText.value;
  showAiChatDialog.value = true;
  hideAITooltip();
};

const closeAiChatDialog = () => {
  showAiChatDialog.value = false;
  selectedText.value = "";
  aiAnswer.value = "";
};

const handleAskQuestionEvent = (data, resolve, reject) => {
  materialStore.askQuestion(props.material.id, {
      highlightedText: data.highlightedText,
      question: data.question
    })
    .then((dto) => {
      // Extract answer and feedbackId from the response
      const answer = dto.aiExplanation || dto;
      const feedbackId = dto.id || null;

      // Resolve with both the answer and the feedbackId
      resolve([answer, feedbackId]);

      // dto.aiExplanation is the text, dto.id is the feedbackId
      resolve([dto.aiExplanation, dto.id]);
    })
    .catch((err) => reject(err));
};

const handleSubmitRatingEvent = (data, resolve, reject) => {
  materialStore
    .submitRating({
      feedbackId: data.feedbackId,
      rating: data.rating,
    })
    .then((response) => {
      resolve(response);
    })
    .catch((err) => reject(err));
};

// Event listeners
const handleDocumentClick = (e) => {
  closeMenuOnOutsideClick(e);
  const tooltip = document.querySelector(".ai-tooltip");
  const markdown = document.querySelector(".markdown-modal");
  if (
    aiTooltipVisible.value &&
    !tooltip?.contains(e.target) &&
    !markdown?.contains(e.target) &&
    !showAiChatDialog.value
  ) {
    hideAITooltip();
  }
};

const handleSelectionChange = () => {
  if (!showFullMarkdown.value || showAiChatDialog.value) return;
  const sel = window.getSelection()?.toString().trim() || "";
  aiTooltipVisible.value = sel.length >= 2;
  selectedText.value = aiTooltipVisible.value ? sel : "";
};

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("mouseup", handleTextSelection);
  document.addEventListener("selectionchange", handleSelectionChange);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
  document.removeEventListener("mouseup", handleTextSelection);
  document.removeEventListener("selectionchange", handleSelectionChange);
});
</script>

<template>
  <div class="material-card" @click="handleMaterialClick">
    <div class="card-header">
      <span class="icon"><component :is="materialIcon" /></span>
      <h3 class="title">{{ material.title }}</h3>

      <Tag
        color="white"
        :icon="isLastUpdatedSameAsUpload ? UploadIcon : UpdateIcon"
        >{{ formattedLastUpdated }}</Tag
      >
      <div v-if="isInstructor" class="actions">
        <button
          ref="menuButtonRef"
          class="more-button"
          @click="toggleMenu"
          title="Options"
        >
          <MoreIcon class="more-icon" />
        </button>
        <div v-if="showMenu" class="menu-wrapper">
          <div ref="menuRef" class="dropdown-menu">
            <button class="dropdown-item" @click="openEditOverlay">
              <EditIcon class="item-icon" /> Edit
            </button>
            <button class="dropdown-item" @click="deleteMaterial">
              <DeleteIcon class="item-icon" /> Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="content">
      <div
        v-if="material.type === 'Markdown'"
        class="markdown"
        v-html="renderedMarkdown"
      ></div>
    </div>

    <!-- Overlays - Using teleport to move to body -->
    <Teleport to="body">
      <!-- Edit Overlay -->
      <div v-if="showEditOverlay" class="overlay">
        <div class="overlay-backdrop" @click="closeEditOverlay"></div>
        <div class="edit-modal" @click.stop>
          <button class="back-button" @click="closeEditOverlay">← Back</button>
          <EditMaterials
            :material="props.material"
            :topicId="props.topicId"
            @close="closeEditOverlay"
          />
        </div>
      </div>

      <!-- Markdown Overlay -->
      <div v-if="showFullMarkdown" class="overlay">
        <div class="overlay-backdrop" @click="toggleMarkdownPopup"></div>
        <div class="markdown-container" :style="{ marginRight: showAiChatDialog || isInstructor ? '300px' : '0' }">
          <div class="markdown-modal" @click.stop>
            <button class="close-button" @click="toggleMarkdownPopup">×</button>
            <h2>{{ material.title }}</h2>

            <div
              class="markdown-body"
              v-html="md.render(material.content)"
              @mouseup="handleTextSelection"
            ></div>

            <div
              v-if="
                !isInstructor &&
                aiTooltipVisible &&
                selectedText &&
                !isAiLoading
              "
              class="ai-tooltip static-position"
              @mousedown.prevent.stop="openAiChatDialog"
            >
              <AiIcon class="ai-tooltip-icon" />
              <span class="ai-tooltip-text">Ask AI</span>
            </div>
          </div>

          <!-- AI Chat Dialog Component -->
          <AiChatDialog
            :is-open="showAiChatDialog"
            :selected-text="selectedText"
            :material-id="props.material.id"
            @close="closeAiChatDialog"
            @ask-question="handleAskQuestionEvent"
            @submit-rating="handleSubmitRatingEvent"
            @loading="(val) => (isAiLoading = val)"
          />

          <AiTeacherMaterialFeedbackList 
            v-if="isInstructor"
            :material-id="props.material.id"
            class="ai-feedback-list"
          />
          <AiStudentMaterialFeedbackList 
            v-if="!isInstructor"
            :material-id="props.material.id"
            class="ai-feedback-list"
          />
        </div>
      </div>

      <!-- PDF Viewer Overlay -->
      <div v-if="showPdfViewer" class="overlay">
        <div class="overlay-backdrop" @click="closePdfViewer"></div>
        <div class="pdf-modal" @click.stop>
          <button class="close-button" @click="closePdfViewer">×</button>
          <h2>{{ material.title }}</h2>
          <iframe
            :src="pdfViewerUrl"
            class="pdf-frame"
            frameborder="0"
            allow="fullscreen"
          ></iframe>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.material-card {
  background-color: var(--vt-c-white);
  border: 2px solid var(--vt-c-grey-light);
  border-radius: 16px;
  padding: 1rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: border-color 0.2s ease;
}
.material-card:hover {
  border-color: var(--vt-c-grey);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  position: relative;
}

.icon {
  font-size: 1.2rem;
  color: var(--vt-c-grey-dark);
}

.title {
  font-size: 1.25rem;
  flex-grow: 1;
  margin: 0;
}

.dates {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

.actions {
  position: relative;
}

.more-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 50%;
}

.more-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.menu-wrapper {
  position: absolute;
  top: 2rem;
  right: 0;
  z-index: 20;
}

.dropdown-menu {
  position: relative;
  background: var(--vt-c-white);
  border: 2px solid var(--vt-c-grey-light);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  z-index: 20;
}

.dropdown-item {
  background: transparent;
  border: none;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--vt-c-grey-dark);
}
.dropdown-item:hover {
  background: var(--vt-c-grey-light);
}
.dropdown-item:first-child {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}
.dropdown-item:last-child {
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}
.item-icon {
  margin-right: 0.5rem;
  width: 1rem;
  height: 1rem;
}

.content {
  padding-left: 2.5rem;
  margin-top: 0.5rem;
}

.markdown {
  color: var(--vt-c-grey-dark);
  font-weight: lighter;
  word-break: break-word;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.overlay-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}
.edit-modal,
.markdown-modal,
.pdf-modal {
  background: var(--vt-c-white);
  color: var(--vt-c-black);
  border-radius: 20px;
  padding: 1.5rem;
  position: relative;
  z-index: 1001;
}
.edit-modal {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Container for markdown and AI chat side by side */
.markdown-container {
  display: flex;
  width: 90%;
  max-width: 800px;
  height: 80vh;
  position: relative;
  z-index: 1001;
  transition: all 0.3s ease;
}

.markdown-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  background: var(--vt-c-white);
  overflow: hidden;
  transition: width 0.3s ease;
}

.markdown-modal h2 {
  margin: 1rem;
}

.markdown-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 1.5rem 1.5rem;
  color: var(--vt-c-grey-dark);
  word-break: break-word;
}

.pdf-modal {
  width: 90%;
  max-width: 1000px;
  height: 90vh;
  display: flex;
  flex-direction: column;
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: var(--vt-c-black);
  align-self: flex-start;
  padding: 0.25rem 0.5rem;
  margin-bottom: 0.5rem;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--vt-c-black);
  padding: 0.25rem 0.5rem;
  border-radius: 50%;
}

.full-markdown {
  margin-top: 1rem;
}

.pdf-frame {
  width: 100%;
  flex-grow: 1;
  border: 1px solid var(--vt-c-grey-light);
  border-radius: 8px;
  margin-top: 0.5rem;
}

.ai-tooltip {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  background-color: var(--vt-c-purple);
  color: var(--vt-c-white);
  border: 2px solid var(--vt-c-purple-dark);
  border-radius: 13px;
  cursor: pointer;
  z-index: 2000;
  animation: fadeIn 0.2s ease-out;
  transition: transform 0.2s ease;
  user-select: none;
  pointer-events: auto;
}

/* Static positioning for the tooltip */
.ai-tooltip.static-position {
  position: absolute;
  bottom: 1.5rem;
  right: 3rem;
}

.ai-tooltip:hover {
  transform: translateY(-2px);
}

.ai-tooltip-icon {
  margin-right: 6px;
  color: var(--vt-c-purple-dark);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
