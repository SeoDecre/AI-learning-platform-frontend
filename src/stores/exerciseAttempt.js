import { defineStore } from "pinia";
import { useAuthUserStore } from "./authUser";
import { useTopicStore } from "./topicStore";
const topicStore = useTopicStore();

export const useExerciseAttemptStore = defineStore("exerciseAttempt", {
    state: () => ({
        exercise: null,
        questions: [],
        answers: {},
        feedback: {},
        aiFeedback: {},
        stats: {},
        isSubmitting: false,
        publishedAiFeedback: {},
    }),

    actions: {
        /**
         * Used to find a particular variant in questions array based on its id
         * @param {Number} variantId ID of the variant to be found
         * @returns QuestionDTO if variant is found, else returns null
         */
        findVariant (variantId) {
            for (const q of this.questions) {
                for (const v of q.questions) {
                    if (v.id == variantId) {
                        return v;
                    }
                }
            }
            return null;
        },

        /**
         *
         * @param {Number} exerciseId ID of exercise
         * @returns
         */
        async fetchSAQGradesToReview(exerciseId) {
            try {
                const res = await fetch(
                    `http://localhost:8080/api/questions/openAnswerGrades/${exerciseId}`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );
                if (!res.ok) throw new Error("Failed to fetch SAQ grades");

                return await res.json(); // returns an array of SAQGradeToConfirmDTO
            } catch (error) {
                console.error("Error fetching SAQ grades to review:", error);
                return [];
            }
        },


        async switchGradeCheck(dto) {
            await fetch("http://localhost:8080/api/questions/switchGradeCheck", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dto),
            });
        },

        async modifySAQGrade(dto) {
            await fetch("http://localhost:8080/api/questions/gradeModify", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dto),
            });
        },

        validateExercise() {
            if (this.exercise.title == "" || this.exercise.description == "") {
                return false;
            }
            if (this.questions.length < 1) {
                return false;
            }
            return this.validateQuestions();
        },

        validateQuestions() {
            let weightCount = 0;
            for (const el of this.questions) {
                const slot = el.questionSlotDTO;
                const q = el.question;
                if (slot.type == "SHORT_ANSWER") {
                    if (!this.validateShortAnswer(q)) {
                        return false;
                    }
                }
                if (slot.type == "MULTI_CHOICE") {
                    if (!this.validateMultiChoice(q)) {
                        return false;
                    }
                } else if (!this.validateTrueFalse(q)) {
                    return false;
                }
                weightCount = weightCount + slot.weight;
            }
            return weightCount == 1;
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

        /**
         * resets all values in the state of the store
         */
        clearStore() {
            this.exercise = {};
            this.questions = [];
            this.answers = {};
            this.feedback = {};
            this.aiFeedback = {};
            this.stats = {};
            this.isSubmitting = false;
        },

        /**
         * GET request to fetch exercise and related questions given exerciseId.
         * The two of them are stored in the state of currentExercise store
         * @param {String} exerciseId ID of the exercise being fetched
         * @param {boolean} reviewMode - Indicates if the exercise is in review mode
         */
        async fetchExercise(exerciseId, reviewMode) {
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
                await this.fetchQuestions(this.exercise.id, reviewMode);
                // Save original state after fetching both exercise and questions
            } catch (error) {
                console.error(
                    "Internal error fetching questions after creating question:  ",
                    error
                );
                return error;
            }
        },

        /**
         * GET request to fetch all questions related to a particular exercise,
         * stores all fetched questions in the state of currentExercise store
         *
         * when reviewMode is true, fetches the questions of the last attempt,
         * when false, fetches a random question betwen the variants
         *
         * @param {String} exerciseId Id of the exercise the fetched questions belong to
         * @param {boolean} reviewMode - Indicates if the exercise is in review mode
         */
        async fetchQuestions(exerciseId, reviewMode) {
            try {
                // Distinguish between review mode and normal mode
                // In review mode questions are not chosen randomly (but are thos of last attempt), in attempt yes
                const endpoint = reviewMode ? `http://localhost:8080/api/exercises/${exerciseId}/last` : `http://localhost:8080/api/slots/${exerciseId}/render/attempt`;


                const res = await fetch(endpoint, {
                    method: "GET",
                    credentials: "include",
                });

                if (!res.ok) {
                    console.error("couldn't fetch questions");
                    this.questions = [];
                    return;
                }

                const data = await res.json();
                this.questions = data.sort((a, b) => a.questionSlotDTO.order - b.questionSlotDTO.order);
            } catch (error) {
                console.error(
                    `internal error when fetching questions for exercise ${exerciseId}: `,
                    error
                );
                this.questions = [];
            }
        },

        async fetchFullExercise(exerciseId) {
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
                await this.fetchAllQuestions(this.exercise.id);
            } catch (error) {
                console.error(
                    "Internal error fetching questions after creating question:  ",
                    error
                );
                return error;
            }
        },

        /**
         * fetches ALL questions and variants related to a particular exercise
         * @param {Number} exerciseId ID of exercise of which all questions need to be fetched
         */
        async fetchAllQuestions (exerciseId) {
            try {

                const res = await fetch (
                    `http://localhost:8080/api/slots/${exerciseId}/render/draft`, {
                        method: 'GET',
                        credentials: 'include'
                    }
                );

                const data = await res.json();

                this.questions = data.sort((a, b) => a.questionSlotDTO.order - b.questionSlotDTO.order);
            } catch (error) {
                console.error("failed fetching all questions", error);
            }
        },

        /**
         * Fetches the feedback data of an exercise for review mode
         * @param {string} exerciseId - ID of the exercise to review
         */
        async fetchFeedback(exerciseId) {
            try {
                const res = await fetch(
                    `http://localhost:8080/api/attempts/feedback/${exerciseId}`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                if (!res.ok) {
                    this.feedback = {};

                    if (res.status === 404) {
                        return { ok: false, reason: "not_found" };
                    }

                    console.error(
                        "Unexpected error fetching feedback data:",
                        res
                    );
                    return { ok: false, reason: "error" };
                }

                this.feedback = await res.json();
                return { ok: true };
            } catch (error) {
                console.error(
                    `internal error when fetching feedback for exercise ${exerciseId}: `,
                    error
                );
                this.feedback = {};
                return { ok: false, reason: "exception" };
            }
        },

        /**
         * Transforms answers into the required DTO structure and submits
         * the user/instructor answers to the backend for grading.
         *
         * @param {string} exerciseId - The exercise being submitted
         */
        async submitAttempt(exerciseId) {
            /* Prevent double–submits coming from a very fast user-clicker
            * or from several components invoking the action at once. */
            if (this.isSubmitting) {
                console.warn("submitAttempt ignored – already running");
                return;
            }
            this.isSubmitting = true;
            try {
                const authUserStore = useAuthUserStore();
                const userId = authUserStore.switchEduID;

                // Transform the user's answers into the expected format for the backend
                const answersArray = this.questions
                    .map((question) => {
                        const answer = this.answers[question.question.id];

                        switch (question.question.type) {
                            case "TRUE_FALSE":
                                return {
                                    questionId: question.question.id,
                                    type: "TRUE_FALSE",
                                    answer: Boolean(answer),
                                };

                            case "MULTI_CHOICE": {
                                return {
                                    questionId: question.question.id,
                                    type: "MULTI_CHOICE",
                                    selectedIndexes: Array.isArray(answer)
                                        ? answer
                                        : [],
                                };
                            }

                            case "SHORT_ANSWER":
                                return {
                                    questionId: question.question.id,
                                    type: "SHORT_ANSWER",
                                    userInput:
                                        Array.isArray(answer) &&
                                        answer.length > 0
                                            ? String(answer[0])
                                            : "",
                                };

                            default:
                                console.warn(
                                    "Unknown question type:",
                                    question.question.type
                                );
                                return null;
                        }
                    })
                    .filter(Boolean);

                const submissionPayload = {
                    exerciseId,
                    answers: answersArray,
                };



                // If instructor: use preview endpoint (not storing in db)
                // Else: use normal endpoint for students (storing in db)
                const endpoint = authUserStore.user.isInstructor
                    ? `http://localhost:8080/api/attempts/${userId}/preview`
                    : `http://localhost:8080/api/attempts/${userId}`;

                const res = await fetch(endpoint, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(submissionPayload),
                });

                if (!res.ok) {
                    throw new Error(
                        "Attempt submission failed: " + (await res.text())
                    );
                }

                this.feedback = await res.json();
            } catch (error) {
                console.error("Error submitting attempt:", error);
                throw error;
            } finally {
                this.isSubmitting = false;
            }
        },

        /**
         * Fetches statistics data for a given exercise
         * and stores the result in `this.stats`.
         *
         * @param exerciseId - The id of the exercise for which you want statistics
         */
        async fetchExerciseStatistics(exerciseId) {
            try {
                const response = await fetch(
                    `http://localhost:8080/api/attempts/statistics/${exerciseId}`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );
                if (!response.ok)
                    throw new Error("Failed to fetch exercise statistics");
                this.stats = await response.json();
            } catch (err) {
                console.warn("Error fetching exercise statistics:", err);
            }
        },

        /**
         * Fetches AI‐generated feedback for a single question and appends it to the store
         * @param {string} exerciseId - ID of the exercise to which the question belongs
         * @param {string} questionId - ID of the question to fetch feedback for
         */
        async fetchAIQuestionFeedback(exerciseId, questionId) {
            try {
                // /AIfeedback/published/{exerciseId}/{questionId}/
                const res = await fetch(
                    `http://localhost:8080/api/ai/AIfeedback/published/${exerciseId}/${questionId}/`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error(
                        "Couldn't fetch AI feedback:",
                        res.statusText
                    );
                    return { ok: false, error: errorText };
                }

                const aiFeedbackList = await res.json();

                if (
                    Array.isArray(aiFeedbackList) &&
                    aiFeedbackList.length > 0
                ) {
                    this.aiFeedback[questionId] =
                        aiFeedbackList[aiFeedbackList.length - 1];
                } else {
                    this.aiFeedback[questionId] =
                        "No AIfeedback generated yet.";
                }

                return { ok: true };
            } catch (err) {
                console.error("Error in fetchAIQuestionFeedback:", err);
                return { ok: false, error: err.message || "Unexpected error" };
            }
        },

        /**
         * Sends a request to generate a new AI feedback to backend and in return gets a list
         * of AIQuestionFeedbackDTO objects. the last of those objects is the newly requested feedback.
         * This last feedback is stored in the store (in aiFeedback), keyed by questionId.
         *
         * @param {string} exerciseId - ID of the exercise to which the question belongs
         * @param {string} questionId - ID of the question to fetch feedback for
         */
        async fetchAIQuestionFeedbackButton(exerciseId, questionId) {
            try {
                const res = await fetch(
                    `http://localhost:8080/api/ai/AIfeedback/${exerciseId}/${questionId}/`,
                    {
                        method: "PUT",
                        credentials: "include",
                    }
                );

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error(
                        "Couldn't fetch AI feedback:",
                        res.statusText
                    );
                    return { ok: false, error: errorText };
                }

                const aiFeedbackList = await res.json();

                if (
                    Array.isArray(aiFeedbackList) &&
                    aiFeedbackList.length > 0
                ) {
                    const last = aiFeedbackList[aiFeedbackList.length - 1];
                    this.aiFeedback[questionId] = last;
                } else {
                    this.aiFeedback[questionId] =
                        "No AIfeedback generated yet.";
                }

                return { ok: true };
            } catch (err) {
                console.error("Error in fetchAIQuestionFeedback:", err);
                return { ok: false, error: err.message || "Unexpected error" };
            }
        },

        /**
         * Fetches the most recent AI feedback associated with a given AI feedback ID
         * and stores it in the `aiFeedback` object, keyed by the question ID.
         * @param {string} AIfeedbackId - The ID for the AI-generated feedback.
         * @param {string} questionId - The ID of the question for which feedback is being fetched.
         */
        async fetchLastAIQuestionFeedback(AIfeedbackId, questionId) {
            try {
                const res = await fetch(
                    `http://localhost:8080/api/ai/AIfeedback/${AIfeedbackId}/`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                if (res.status === 404) {
                    return;
                }

                if (!res.ok) {
                    console.error(
                        "Couldn't fetch last AI feedback:",
                        res.statusText
                    );
                    return;
                }

                const aiFeedbackString = await res.text();

                this.aiFeedback[questionId] =
                    aiFeedbackString || "No AIfeedback generated yet.";
            } catch (err) {
                console.error("Error in fetchLastAIQuestionFeedback:", err);
            }
        },

        /**
         * Fetches the most recent AI feedback for all questions in the exercise
         * and stores it in the `aiFeedback` object, keyed by the question ID.
         */
        fetchAllLastAIQuestionFeedback() {
            const resultMap = this.feedback?.last_attempt?.resultMap || {};

            for (const [questionId, data] of Object.entries(resultMap)) {
                const aiFeedbackId = data?.AiFeedbackId;
                if (aiFeedbackId) {
                    this.fetchLastAIQuestionFeedback(aiFeedbackId, questionId);
                }
            }
        },

        /**
         * Submits rating for an ai feedback
         * @param ratingDto - DTO containing the rating information
         *
         */
        async submitRating(ratingDto) {
            try {
                const res = await fetch(
                    `http://localhost:8080/api/ratings/add`,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(ratingDto),
                    }
                );

                if (!res.ok) throw new Error(await res.text());
                return await res.json();
            } catch (error) {
                console.error("Error submitting rating:", error);
                throw error;
            }
        },

        /**
         * Fetches the published AI-generated feedback for a specific question.
         * @param {string} exerciseId - ID of the exercise.
         * @param {string} questionId - ID of the question.
         */
        async fetchPublishedAIQuestionFeedback(exerciseId, questionId) {
            try {
                const res = await fetch(
                    `http://localhost:8080/api/ai/AIfeedback/published/${exerciseId}/${questionId}/`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error("Couldn't fetch published AI feedback:", errorText);
                    return { ok: false, error: errorText };
                }

                // store the full list under publishedAiFeedback
                this.publishedAiFeedback[questionId] = await res.json();
                return { ok: true };
            } catch (err) {
                console.error("Error in fetchPublishedAIQuestionFeedback:", err);
                return { ok: false, error: err.message || "Unexpected error" };
            }
        },

    },
});
