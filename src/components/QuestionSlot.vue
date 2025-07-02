<template>
    <div
        class="question-slot-container"
        :class="{ 'pulsing-ai-background': generating }"
    >
        <!-- Header with drag handle, title, and delete button -->
        <div class="slot-header">
            <div class="slot-title">
                <component :is="questionIconComponent" class="question-icon" />
                <h2>{{ questionType }}</h2>
            </div>

            <DeleteIcon
                @click="deleteSelf"
                aria-label="Delete question"
                class="delete-button"
            />

            <div
                class="drag-handle"
                title="Drag to reorder"
                draggable="true"
                @dragstart="handleDragStart"
                @dragend="handleDragEnd"
            >
                <div class="drag-dots">
                    <span></span><span></span><span></span> <span></span
                    ><span></span><span></span>
                </div>
            </div>
        </div>

        <EditQuestion
            :slotId="questionSlot.id"
            :question="questions[selectedQuestion]"
            v-if="questions.length"
        />

        <div class="options-container">
            <CreateQuestionButton
                :isInSlot="true"
                :onPress="CreateNewVariant"
            />
            <CustomButton
                v-if="!generating && questions.length"
                class="ai-variant-button"
                text="New AI variant"
                :icon="AiIcon"
                color="purple"
                @click="GenerateNewVariant"
            />
            <div v-if="generating" class="loading-container">
                <div class="spinner"></div>
                <span>Generating variant...</span>
            </div>
            <QuestionVariantNavigator
                v-if="questions.length"
                class="question-variant-navigator"
                :questionId="questionSlot.id"
                :currentIndex="selectedQuestion"
                :total="questions.length"
                @update:index="questions[selectedQuestion] = $event"
                :onScroll="scrollVariants"
            />
        </div>

        <div class="weight-container">
            <div class="weight-input-group">
                <div class="weight-control">
                    <FillIcon class="fill-icon" @click="fillWeight" />
                    <input
                        type="number"
                        id="weight"
                        name="weight"
                        min="1"
                        max="100"
                        v-model="percentageWeight"
                        @input="enforceRange"
                        @change="handleWeightChange"
                        ref="weightInputRef"
                    />
                    <span class="percentage-symbol">%</span>
                    <label for="weight" class="weight-label">weight</label>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
// IMPORTS
import EditQuestion from "./EditQuestion.vue";
import { useExerciseEditStore } from "@/stores/exerciseEdit";
import { ref, watchEffect, computed, watch, onMounted, nextTick } from "vue";
import CustomButton from "./CustomButton.vue";
import TrueFalseIcon from "./icons/TrueFalseIcon.vue";
import ShortAnswerIcon from "./icons/ShortAnswerIcon.vue";
import MultiChoiceIcon from "./icons/MultiChoiceIcon.vue";
import DeleteIcon from "./icons/DeleteIcon.vue";
import QuestionVariantNavigator from "./QuestionVariantNavigator.vue";
import AiIcon from "./icons/AiIcon.vue";
import FillIcon from "./icons/FillIcon.vue";
import CreateQuestionButton from "./CreateQuestionButton.vue";

// PROPS
const props = defineProps({
    questionSlot: Object,
    questions: Array,
});

const emit = defineEmits(["drag-start", "drag-end"]);

const editExercise = useExerciseEditStore();
const percentageWeight = ref(props.questionSlot.weight * 100);
const selectedQuestion = ref(0);
const questionType = ref("");
const generating = ref(false);
const weightInputRef = ref(null);

// Resize weight input
const resizeInput = () => {
    if (weightInputRef.value) {
        const input = weightInputRef.value;
        input.style.width = "1ch";
        input.style.width = `${input.value.length + 1}ch`;
    }
};

const enforceRange = (e) => {
    const val = e.target.value;
    if (val === "") return;
    if (+val < 1) percentageWeight.value = 1;
    else if (+val > 100) percentageWeight.value = 100;
};

watch(percentageWeight, () => {
    nextTick(() => resizeInput());
});

onMounted(() => {
    nextTick(() => resizeInput());
});

// Determine icon
const questionIconComponent = computed(() => {
    switch (props.questionSlot.questionType) {
        case "MULTI_CHOICE":
            questionType.value = "Multiple Choice Slot";
            return MultiChoiceIcon;
        case "TRUE_FALSE":
            questionType.value = "True False Slot";
            return TrueFalseIcon;
        case "SHORT_ANSWER":
            questionType.value = "Short Answer Slot";
            return ShortAnswerIcon;
        default:
            return null;
    }
});

watchEffect(() => {
    percentageWeight.value = Math.trunc(props.questionSlot.weight * 100);
});

watch(
    () => props.questions,
    (newQuestions) => {
        if (selectedQuestion.value >= newQuestions.length) {
            selectedQuestion.value = newQuestions.length - 1;
        }
    }
);

const handleDragStart = (event) => emit("drag-start", event);
const handleDragEnd = (event) => emit("drag-end", event);

const scrollVariants = (direction) => {
    if (direction && selectedQuestion.value < props.questions.length - 1) {
        selectedQuestion.value++;
    } else if (!direction && selectedQuestion.value > 0) {
        selectedQuestion.value--;
    }
};

const fillWeight = () => {
    editExercise.fillWeight(props.questionSlot.id);
};

const handleWeightChange = () => {
    if (percentageWeight.value < 1 || percentageWeight.value > 100) {
        window.alert("Weight value must be between 1 and 100!");
        percentageWeight.value = Math.trunc(props.question.weight * 100);
        return;
    }

    const newValue = percentageWeight.value / 100;
    if (newValue !== props.questionSlot.weight) {
        editExercise.changeWeight(props.questionSlot.id, newValue);
    }
};

const CreateNewVariant = async (createVariantDTO) => {
    createVariantDTO.questionSlotReference = props.questionSlot.id;
    createVariantDTO.type = props.questionSlot.questionType;

    switch (props.questionSlot.questionType) {
        case "MULTI_CHOICE":
            createVariantDTO.options = ["option 1", "option 2", "option 3"];
            createVariantDTO.correctIndexes = [0];
            break;
        case "TRUE_FALSE":
            createVariantDTO.correctAnswer = true;
            break;
        case "SHORT_ANSWER":
            createVariantDTO.modelAnswer = "expected answer...";
            break;
    }

    await editExercise.createVariant(createVariantDTO);
};

const GenerateNewVariant = async () => {
    if (props.questions.length) {
        generating.value = true;
        await editExercise.generateVariant(props.questionSlot.id);
        generating.value = false;
        selectedQuestion.value = props.questions.length - 1;
    }
};

const deleteSelf = async () => {
    editExercise.deleteQuestion(props.questionSlot.id);
};
</script>

<style scoped>
.slot-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 0.5rem;
    margin-bottom: 0.2rem;
}

.slot-title {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
}

.question-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    margin-bottom: 4px;
    color: var(--vt-c-grey-dark);
}

.delete-button {
    width: 20px;
    height: 20px;
    color: var(--vt-c-red-dark);
    flex-shrink: 0;
    cursor: pointer;
    transition: all 0.3s;
    opacity: 0.4;
}

.delete-button:hover {
    opacity: 0.8;
}

/* Drag handle styles */
.drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    min-width: 24px;
    height: 40px;
    cursor: grab;
    opacity: 0.4;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 0 4px;
    flex-shrink: 0;
    user-select: none;
    -webkit-user-drag: element;
}

.drag-handle:hover {
    opacity: 0.8;
}

.drag-handle:active {
    cursor: grabbing;
    transform: scale(0.95);
}

.drag-dots {
    display: grid;
    grid-template-columns: repeat(2, 4px);
    grid-template-rows: repeat(3, 4px);
    gap: 2px;
    transition: all 0.2s ease;
}

.drag-dots span {
    width: 4px;
    height: 4px;
    background-color: var(--vt-c-grey-dark);
    border-radius: 50%;
    transition: all 0.2s ease;
}

.question-slot-container {
    padding: 15px 20px;
    border: 2px solid var(--vt-c-grey-light);
    border-radius: 20px;
    background-color: var(--vt-c-white);
    width: 100%;
    display: flex;
    flex-direction: column;
    transition: all 0.5s ease;
}

.pulsing-ai-background {
    animation: pulseGradient 2s ease-in-out infinite;
    background: linear-gradient(
        135deg,
        #f5e8ff,
        #fde9f1,
        #f0dbff,
        #fde9f1,
        #f5e8ff
    );
    background-size: 300% 300%;
    box-shadow: 0 0 8px rgba(210, 170, 250, 0.2);
    border-color: color-mix(in srgb, var(--vt-c-purple-light), white 50%);
}

@keyframes pulseGradient {
    0% {
        background-position: 0% 50%;
        filter: brightness(1);
    }
    50% {
        background-position: 100% 50%;
        filter: brightness(1.05);
    }
    100% {
        background-position: 0% 50%;
        filter: brightness(1);
    }
}

.question-controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

input[type="number"] {
    border: none;
    font-size: 1.5rem;
    text-align: center;
    font-weight: bold;
    color: var(--vt-c-purple-dark);
    width: auto;
    min-width: 2ch;
    max-width: 5ch;
    background-color: transparent;
    padding: 0;
}

/* Hide spinner arrows for Chrome, Safari, Edge, Opera */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

input[type="number"]:focus {
    outline: none;
    border-color: var(--vt-c-purple);
    transition: border-color 0.2s ease;
}

.weight-input-group {
    display: flex;
    align-items: center;
    justify-content: flex-start;
}

.weight-label {
    font-size: 1rem;
    color: var(--vt-c-grey-dark);
}

.weight-control {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
}

.percentage-symbol {
    font-size: 1.5rem;
    font-weight: bold;
    margin-right: 1rem;
    color: var(--vt-c-purple-dark);
}

.fill-icon {
    width: 20px;
    height: 20px;
    color: var(--vt-c-purple-dark);
    opacity: 0.5;
    transition: all 0.3s;
    cursor: pointer;
}

.fill-icon:hover {
    opacity: 1;
}

@media (max-width: 640px) {
    .weight-input-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .weight-control {
        width: 100%;
        justify-content: space-between;
    }

    .drag-handle {
        width: 32px;
        min-width: 32px;
        height: 48px;
    }

    .drag-dots {
        grid-template-columns: repeat(2, 5px);
        grid-template-rows: repeat(3, 5px);
        gap: 3px;
    }

    .drag-dots span {
        width: 5px;
        height: 5px;
    }
}

.options-container {
    display: flex;
    flex-direction: row;
    gap: 1.5rem;
    align-items: center;
    margin: 1rem 0;
}

.question-variant-navigator {
    margin-left: auto;
}

.loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 500;
    color: var(--vt-c-grey-dark);
    animation: fadeIn 0.3s ease-in-out;
}

.spinner {
    width: 1.25rem;
    height: 1.25rem;
    border: 3px solid var(--vt-c-purple);
    border-top-color: var(--vt-c-purple-dark);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
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
