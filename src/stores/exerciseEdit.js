import { defineStore } from "pinia";

export const useExerciseEditStore = defineStore("currentExercise", {
    state: () => ({
        exercise: null,
        questions: [],
        dirty: false,
        // Add state to track original data for change detection
        originalState: null,
    }),

    actions: {
        // ===============================================
        // LOCAL ACTIONS (NO INTERACTION WITH BACKEND)
        // ===============================================

        /**
         * retrieve index of a question in questions array
         * @param {String} questionId ID of question to be found
         * @returns index of question in case question exists, else -1
         */
        findIdx(questionId) {
            let i = 0;
            for (const question of this.questions) {
                if (question.questionSlotDTO.id === questionId) {
                    return i;
                } else {
                    i++;
                }
            }
            return -1;
        },

        findVarIdx(questionId, variantId) {
            const i = this.findIdx(questionId);
            let j = 0;
            for (const variant of this.questions[i].questions) {
                if (variantId == variant.id) {
                    return [i, j];
                } else {
                    j++;
                }
            }
            return [-1, -1];
        },

        /**
         * retrieves a question from questions array
         * @param {String} questionId ID of question to be found
         * @returns a question object in case question exists, null otherwise
         */
        findQuestion(questionId) {
            for (const question of this.questions) {
                if (question.questionSlotDTO.id === questionId) {
                    return question;
                }
            }
            return null;
        },

        findVariant(questionId, variantId) {
            const question = this.findQuestion(questionId);
            for (const variant of question.questions) {
                if (variant.id == variantId) {
                    return variant;
                }
            }
            return null;
        },

        /**
         * resets all values in the state of the store
         */
        clearStore() {
            this.exercise = {};
            this.questions = [];
            this.dirty = [];
            this.originalState = null;
        },

        /**
         * Creates a deep copy of the current exercise and questions state
         * to track changes against the original
         */
        saveOriginalState() {
            if (!this.exercise) return;

            // Create a deep copy of the current state
            this.originalState = {
                exercise: JSON.parse(JSON.stringify(this.exercise)),
                questions: JSON.parse(JSON.stringify(this.questions)),
            };
        },

        /**
         * Compares current state with original state to determine if changes exist
         * @returns {boolean} true if changes detected, false if no changes
         */
        checkForChanges() {
            // If no original state exists, nothing has changed yet
            if (!this.originalState) return false;

            const originalEx = JSON.stringify(this.originalState.exercise);
            const currentEx = JSON.stringify(this.exercise);

            const originalQs = JSON.stringify(this.originalState.questions);
            const currentQs = JSON.stringify(this.questions);

            this.dirty =  originalEx !== currentEx || originalQs !== currentQs;

            return this.dirty;
        },

        /**
         * sets current exercise to dirty (needs to be saved) based on actual changes
         */
        setDirty() {
            this.dirty = this.checkForChanges();
        },

        /**
         * removes dirty flag from current exercise
         */
        clean() {
            this.dirty = false;
            // Update original state to match current state after saving
            this.saveOriginalState();
        },

        /**
         * Edits a true false question's answer to the opposite
         * @param {String} questionId ID of question whose answer is to be edited
         */
        editTrueFalse(questionId, variantId) {
            const question = this.findVariant(questionId, variantId);
            if (question == null) {
                return;
            }
            question.correctAnswer = !question.correctAnswer;
            this.checkForChanges();
        },

        /**
         * adds a new empty option to options of multichoice question
         * @param {String} questionId ID of question to be edited
         */
        addOption(questionId, variantId) {
            const question = this.findVariant(questionId, variantId);
            if (question == null) {
                return;
            }
            question.options.push("");
            this.checkForChanges();
        },

        /**
         * Remove from correctIndexes the deleted index and adjust the array accordingly
         * @param {QuestionDTO} question Question Object to be edited
         * @param {Number} deletedIdx Index of deleted option
         */
        removeCorrectIndex(question, deletedIdx) {
            let i = 0;
            const CI = question.correctIndexes;
            while (i < CI.length) {
                if (CI[i] == deletedIdx) {
                    CI.splice(i, 1);
                } else if (CI[i] > deletedIdx) {
                    CI[i] = CI[i] - 1;
                    i++;
                } else {
                    i++;
                }
            }
        },

        /**
         * Delete an option from a specific multi choice question
         * @param {String} questionId ID of question to be edited
         * @param {String} option option to be deleted
         */
        deleteOption(questionId, variantId, option) {
            const question = this.findVariant(questionId, variantId);
            if (question == null) {
                return;
            }
            let i = 0;
            for (const opt of question.options) {
                if (option === opt) {
                    const deletedIdx = question.options.indexOf(option);
                    question.options.splice(i, 1);
                    this.removeCorrectIndex(question, deletedIdx);
                    this.checkForChanges();
                    return;
                }
                i++;
            }
        },

        /**
         * update an option of a specific question
         * @param {String} questionId ID of question to be edited
         * @param {String} oldOption old option to be replaced
         * @param {String} newOption new option to be used
         */
        changeOption(questionId, variantId,oldOption, newOption) {
            const question = this.findVariant(questionId, variantId);
            if (question == null) {
                return;
            }
            let i = 0;
            for (const opt of question.options) {
                if (oldOption === opt) {
                    question.options[i] = newOption;
                    this.checkForChanges();
                    return;
                }
                i++;
            }
        },

        /**
         * Adds if not already there or removes if already present from correctIndexes array an index
         * @param {String} questionId ID of question to be edited
         * @param {Number} index option to be added or removed from correctIndexes array
         */
        setCorrectOption(questionId, variantId, index) {
            const question = this.findVariant(questionId, variantId);
            if (question == null) {
                return;
            }
            let i = 0;
            for (const answer of question.correctIndexes) {
                if (index === answer) {
                    question.correctIndexes.splice(i, 1);
                    this.checkForChanges();
                    return;
                }
                i++;
            }
            question.correctIndexes.push(index);
            this.checkForChanges();
        },

        editShortAnswer(questionId, variantId, newString) {
            const question = this.findVariant(questionId, variantId);
            if (question == null) {
                return;
            }
            question.modelAnswer = newString;
            this.checkForChanges();
        },


        /**
         * Moves a specific question up or down by one spot
         * @param {Boolean} direction direction of switch, true := up; false := down
         * @param {String} questionId ID of question to be moved
         */
        reorderQuestions(direction, questionId) {
            const i = this.findIdx(questionId);
            // true := up ; false := down
            const dir = direction == "up";
            if (dir && i > 0) {
                const tmp = this.questions[i];
                this.questions[i] = this.questions[i - 1];
                this.questions[i - 1] = tmp;
                this.checkForChanges();
            }
            if (!dir && i < this.questions.length - 1) {
                const tmp = this.questions[i];
                this.questions[i] = this.questions[i + 1];
                this.questions[i + 1] = tmp;
                this.checkForChanges();
            }
        },

        /**
         * Changes weight to an arbitrary value between 0 and 1
         * @param {String} questionId ID of question to be edited
         * @param {Number} newValue new weight value to be applied to question
         */
        changeWeight(questionId, newValue) {
            const question = this.findQuestion(questionId);
            if (question == null) {
                return;
            }
            question.questionSlotDTO.weight = newValue;
            this.checkForChanges();
        },

        /**
         * balance weight equally of all questions in current exercise
         */
        balanceWeight() {
            const averageWeight = 1 / this.questions.length;
            for (const question of this.questions) {
                question.questionSlotDTO.weight = averageWeight;
            }
            this.checkForChanges();
        },

        /**
         * Sets question weight of a specifc question to all available weight left in question
         * @param {String} questionId ID of question to be edited
         */
        fillWeight(questionId) {
            const question = this.findQuestion(questionId);
            if (question == null) {
                return;
            }
            let usedWeight = 0;
            for (const q of this.questions) {
                if (q.questionSlotDTO !== question.questionSlotDTO) {
                    usedWeight = usedWeight + q.questionSlotDTO.weight;
                }
            }
            const vacantWeight = 1 - usedWeight;
            question.questionSlotDTO.weight = vacantWeight;
            this.checkForChanges();
        },

        validateShortAnswers(questions) {
            for (const q in questions) {
                if (!this.validateShortAnswer(q)) {
                    return false;
                }
            }
        },

        validateMultiChoices(questions) {
            for (const q in questions) {
                if (!this.validateMultiChoice(q)) {
                    return false;
                }
            }
        },

        validateTrueFalses(questions) {
            for (const q in questions) {
                if (!this.validateTrueFalse(q)) {
                    return false;
                }
            }
        },

        validateSlot(questions, type) {
            if (type == "SHORT_ANSWER") {
                this.validateShortAnswers(questions);
            } else if (type == "MULTI_CHOICE") {
                this.validateMultiChoices(questions);
            } else {
                this.validateTrueFalses(questions);
            }
        },

        /**
         * Validate Short Answer specific fields for publishing
         * @param {QuestionDTO} question question to be validated
         */
        validateShortAnswer(question) {
            if (question.title == "" || question.description == "") {
                return false;
            }
            return question.modelAnswer;
        },
        

        /**
         * Validate Multi Choice specific fields for publishing
         * @param {QuestionDTO} question question to be validated
         */
        validateMultiChoice(question) {
            if (question.title == "" || question.description == "") {
                return false;
            }
            for (const opt of question.options) {
                if (opt == "") {
                    return false;
                }
            }
            return (
                question.options.length > 0 &&
                question.correctIndexes.length > 0 &&
                question.correctIndexes.length < question.options.length
            );
        },

        validateTrueFalse(question) {
            return !(question.title == "" || question.description == "");
        },

        validateQuestions() {
            let weightCount = 0;
            for (const q of this.questions) {
                this.validateSlot(q.questions, q.questionSlotDTO.type);
                weightCount = weightCount + q.questionSlotDTO.weight;
            }
            return weightCount == 1;
        },

        /**
         * Validate a full exercise for publishing
         */
        validateExercise() {
            if (this.exercise.title == "" || this.exercise.description == "") {
                return false;
            }
            if (this.questions.length < 1) {
                return false;
            }
            return this.validateQuestions();
        },

        validateInfo() {
            let res = [true];
            if (this.exercise.title == "" || this.exercise.description == "") {
                res[0] = false;
                res.push("exercise info");
            }
            if (!this.validateQuestions()) {
                res[0] = false;
                res.push("questions");
            }
            return res;
        },

        /**
         * shuffle questions of current exercise
         */
        shuffleQuestions() {
            const qs = this.questions;
            let currIdx = qs.length;
            while (currIdx != 0) {
                let randomIdx = Math.floor(Math.random() * currIdx);
                currIdx--;
                [qs[currIdx], qs[randomIdx]] = [qs[randomIdx], qs[currIdx]];
            }
            this.checkForChanges();
        },

        // ===============================================
        // BACKEND RELATED ACTIONS
        // ===============================================

        /**
         * GET request to fetch exercise and related questions given exerciseId.
         * The two of them are stored in the state of currentExercise store
         * @param {String} exerciseId ID of the exercise being fetched
         */
        async fetchExercise(exerciseId) {
            try {
                const res = await fetch(
                    `http://localhost:8080/api/exercises/${exerciseId}`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                if (!res.ok) {
                    console.error("Response not OK!");
                    return res;
                }

                const data = await res.json();
                this.exercise = data;
            } catch (error) {
                console.error("Error fetching exercise:", error.message);
            }

            try {
                await this.fetchQuestions(this.exercise.id);
                // Save original state after fetching both exercise and questions
                this.saveOriginalState();
            } catch (error) {
                console.error(
                    "Internal error fetching questions after creating question:  ",
                    error
                );
                return error;
            }
        },

        /**
         * PUT request to update a particular exercise,
         * stores updated exercise in state directly,
         * no further call to fetchExercise is needed
         * @param {FullExerciseDTO} updatedExercise An object containing all of the updated
         * information about the edited exercise
         * @param {String} exerciseId ID of the exercise that is being updated
         */
        async updateExerciseInfo(updatedExercise, exerciseId) {
            try {
                const res = await fetch(
                    `http://localhost:8080/api/exercises/${exerciseId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(updatedExercise),
                        credentials: "include",
                    }
                );

                if (!res.ok) {
                    console.error("couldn't update the exercise", res);
                    return res.status;
                }
                const updatedEx = await res.json();
                this.exercise = updatedEx;
                return res.status;
            } catch (error) {
                console.error("internal error updating exercise: ", error);
                return 500;
            }
        },

        /**
         * @param {String} exerciseId ID of the exercise that is being published
         */
        async publishExercise(exerciseId) {
            try {
                const res = await fetch(
                    `http://localhost:8080/api/exercises/${exerciseId}/draft`,
                    {
                        method: "PUT",
                        credentials: "include",
                    }
                );

                if (!res.ok) {
                    console.error("couldn't publish the exercise");
                    return;
                }
            } catch (error) {
                console.error("internal error publishing exercise: ", error);
            }
        },

        /**
         * POST request to create a new question in the DataBase tied to a particular
         * exercise, question is automatically added to state of currentExercise store
         * @param {CreateQuestionDTO} newQuestion DTO containing basic information about the question
         * @param {String} exerciseId Id of the exercise the topic belongs to
         */
        async createQuestion(newQuestion) {
            try {
                const res = await fetch(
                    `http://localhost:8080/api/slots/create`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(newQuestion),
                        credentials: "include",
                    }
                );

                if (!res.ok) {
                    console.error("couldn't create a new question");
                    return;
                }

                const data = await res.json();
                let newQ = {
                    questionSlotDTO: data,
                    questions: []
                }
                this.questions.push(newQ);
                this.checkForChanges();

            } catch (error) {
                console.error("internal error creating question: ", error);
            }
        },

        async createVariant(createVariantDTO) {
            try {
                const res = await fetch(`http://localhost:8080/api/questions/create` , {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(createVariantDTO),
                    credentials: "include",
                });

                if (!res.ok) {
                    console.error ("couldn't create variant");
                    return res.status;
                }

                const newVariant = await res.json()

                const questionIdx = this.findIdx(newVariant.questionSlotId);

                this.questions[questionIdx].questions.push(newVariant);
                
                this.checkForChanges()
                return 200
            } catch (error) {
                console.error("couldn't create variant for question slot", createVariantDTO.questionSlotReference, error);
                return 400
            }
        },

        /**
         * GET request to fetch all questions related to a particular exercise,
         * stores all fetched questions in the state of currentExercise store
         * @param {String} exerciseId Id of the exercise the fetched questions belong to
         */
        async fetchQuestions(exerciseId) {
            try {
                const res = await fetch(
                    `http://localhost:8080/api/slots/${exerciseId}/render/draft`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                if (!res.ok) {
                    console.error("couldn't fetch questions");
                    this.questions = [];
                    return;
                }

                const data = await res.json();

                this.questions = data;
            } catch (error) {
                console.error(
                    `internal error when fetching questions for exercise ${exerciseId}: `,
                    error
                );
                this.questions = [];
            }
        },

        /**
         * DELETE request to delete a particular queston, automatically refetches exercise's questions
         * @param {*} questionId ID of the question to be deleted
         * @param {*} exerciseId ID of the exercise to which the question relates to
         */
        async deleteQuestion(questionId) {
            try {
                const res = await fetch(
                    `http://localhost:8080/api/slots/${questionId}`,
                    {
                        method: "DELETE",
                        credentials: "include",
                    }
                );
                if (!res.ok) {
                    console.error("couldn't delete questions");
                    return res.status;
                }

                const qIdx = this.findIdx(questionId);
                this.questions.splice(qIdx, 1);
                this.checkForChanges();
                return res.status;
            } catch (error) {
                console.error(`internal error when deleting question: `, error);
                return 500;
            }
        },

        async deleteVariant(questionId, variantId) {
            try {
                const res = await fetch (`http://localhost:8080/api/questions/${variantId}`, {
                    method: "DELETE",
                    credentials: "include",
                });
                if (!res.ok) {
                    console.error("couldn't delete variant");
                    return res.status;
                }

                const qIdxs = this.findVarIdx(questionId, variantId);
                const updatedVariants = [...this.questions[qIdxs[0]].questions];
                updatedVariants.splice(qIdxs[1], 1);
                this.questions[qIdxs[0]].questions = updatedVariants;

                this.checkForChanges()

                return res.status;
            } catch (error) {
                console.error(`internal error when deleting question `, error);
                return 0
            }
        },

        /**
         * PUT request to update the contents of a particular question
         * @param {QuestionDTO} updatedQuestion Object containing all of the updated info about a question (varies based on question type)
         */
        async updateQuestion(updatedQuestion) {
            const questionId = updatedQuestion.id;
            try {
                const res = await fetch(
                    `http://localhost:8080/api/slots/weight`,
                    {
                        method: "PUT",
                        body: JSON.stringify({
                            questionSlotReference: questionId,
                            weight: updatedQuestion.weight,
                        }),
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include",
                    }
                );

                if (!res.ok) {
                    console.error("couldn't update the question");
                    return res.status;
                }

                return res.status;
            } catch (error) {
                console.error("internal error updating question: ", error);
                return 500;
            }
        },

        async updateVariant(variantDTO) {
            const questionId = variantDTO.id;
            try {
                const res = await fetch(
                    `http://localhost:8080/api/questions/${questionId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(variantDTO),
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include",
                    }
                );

                if (!res.ok) {
                    console.error("couldn't update the variant");
                    return res.status;
                }

                return res.status;
            } catch (error) {
                console.error("internal error updating variant: ", error);
                return 500;
            }
        },

        async updateQuestions() {
            let res = 200;
            for (const question of this.questions) {
                res = await this.updateQuestion(question.questionSlotDTO);
                if (res !== 200) {
                    return res;
                }
                for (const variant of question.questions) {
                    res = await this.updateVariant(variant);
                    if (res !== 200) {
                        return res;
                    }
                }
            }
            return res;
        },

        /**
         * Update the modelAnswer string for a short‐answer question
         * @param {String} questionId
         * @param {String} newAnswer
         */
        updateShortAnswer(questionId, newAnswer) {
            const question = this.findQuestion(questionId);
            if (!question) return;
            question.modelAnswer = newAnswer;
        },

        async saveExercise(updatedExercise, exerciseId) {
            let res;
            res = await this.updateExerciseInfo(updatedExercise, exerciseId);

            if (res !== 200) {
                return [res, "exercise info"];
            }
            res = await this.updateQuestions();

            if (res !== 200) {
                return [res, "question info"];
            }
            res = await this.moveQuestion();
            if (res !== 200) {
                return [res, "question order"];
            }
            this.clean();
            return [res];
        },

        /**
         * POST request to reorder questions given a new order
         */
        async moveQuestion() {
            const orderedQuestions = [];
            for (const question of this.questions) {
                orderedQuestions.push(question.questionSlotDTO.id);
            }
            try {
                const res = await fetch(
                    `http://localhost:8080/api/slots/reorder/${this.exercise.id}`,
                    {
                        method: "POST",
                        body: JSON.stringify(orderedQuestions),
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include",
                    }
                );
                if (!res.ok) {
                    console.error("couldn't reorder question");
                    return res.status;
                }

                return res.status;
            } catch (error) {
                console.error(
                    `internal error when reordering questions: `,
                    error
                );
                return 500;
            }
        },

        reorderQuestionsByIndex(fromIndex, toIndex) {
            if (fromIndex === toIndex) return;
            
            const questions = [...this.questions];
            const [movedQuestion] = questions.splice(fromIndex, 1);
            questions.splice(toIndex, 0, movedQuestion);
            
            this.questions = questions;
            this.setDirty();
        },

        async generateVariant (questionSlotId) {
            try {
                const res = await fetch(`http://localhost:8080/api/variants/${questionSlotId}`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                if (!res.ok) {
                    console.error("failed generating variant!");
                    return res.status;
                }

                const newVariant = await res.json()
                const questionIdx = this.findIdx(newVariant.questionSlotId);
                this.questions[questionIdx].questions.push(newVariant);

                this.checkForChanges();
                return res.status;
            } catch (error) {
                console.error("error when generating variant", error);
                return 400;
            }
        }

    },
});
