import { defineStore } from 'pinia'

export const useExerciseStore = defineStore('exercise', {
  state: () => ({
    exercises: null
  }),
  getters: {
    getAllExercises: (state) => state.exercises,
    getDraftExercises: (state) => state.exercises.filter(e => e.is_draft)
  },
  actions: {
    async fetchExercisesByTopic(topicId) {
      try {
        const response = await fetch(`http://localhost:8080/api/topic/${topicId}/exercises/list`, {
          method: 'GET',
          credentials: 'include'
        });
        if (!response.ok) {
          console.error('Failed to fetch exercises');
          return;
        }
        const data = await response.json();
        this.exercises = data;
      } catch (error) {
        console.error('Error fetching exercises by topic:', error);
      }
    }, 
    
    resetExercises() {
      this.exercises = null;
    },

    findIdxById(exerciseId) {
      let idx = 0;
      for(const exercise of this.exercises) {
        if (exercise.id === exerciseId) {
          return idx;
        }
        idx++;
      }
      return -1;
    },

    /**
     * POST request to create a new exercise in the DataBase tied to a topic
     * @param {String} topicId Id of topic that the exercise belongs to
     * @param {String} title Title of the newly created exercise
     * @param {String} description Description of the newly created exercise
     */
    async createExercise(topicId, title, description) {
      try {
          const res = await fetch(
              `http://localhost:8080/api/exercises/create/${topicId}`,
              {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                      title: title,
                      description: description,
                  }),
                  credentials: "include",
              }
          );

          if (!res.ok) {
              console.error("couldn't create a new exercise");
              return;
          }
      } catch (error) {
          console.error("internal error creating exercise: ", error);
      } finally {
          this.fetchExercisesByTopic(topicId);
      }
  },

    /**
     * DELETE request to delete a particular exercise
     * @param {String} exerciseId ID of the exercise to be deleted
     */
    async deleteExercise(exerciseId) {
      try {
        const response = await fetch(`http://localhost:8080/api/exercises/${exerciseId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (!response.ok) {
          console.error('Failed to delete exercise');
          return;
        }
        
        const idx = this.findIdxById(exerciseId);

        this.exercises.splice(idx, 1);

      } catch (error) {
        console.error('Error deleting exercise:', error);
      }
    },
  }
  })
