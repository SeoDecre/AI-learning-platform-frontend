import { defineStore } from 'pinia'
import { useAuthUserStore } from '@/stores/authUser'
const userStore = useAuthUserStore();

export const useTopicStore = defineStore('topic', {
  state: () => ({
    topics: [],               // Used by students and instructors depending on context
    instructorTopics: [],     // Topics authored by the current instructor
    allTopics: [],            // All topics across all instructors
    currentTopic: null,
  }),

  actions: {
    /**
     * Fetches topics to be displayed on the dashboard, depending on the user's role.
     * Students receive their available topics, while instructors get an overview of their courses.
     */
    async fetchTopicsDashboard() {
      const userId = this.getUserId();
      if (!userId) return;

      const user = useAuthUserStore().user;
      const endpoint = user.isInstructor
        ? `http://localhost:8080/api/statistics/${userId}/dashboardInstructor`
        : `http://localhost:8080/api/statistics/${userId}/dashboard`;

      const target = user.isInstructor 
        ? 'allTopics'
        : 'topics'
      await this.fetchAndAssign(endpoint, target);
    },

    /**
     * Fetches topics authored by the currently logged-in instructor.
     * Used to show only their own content, not all instructor topics.
     */
    async fetchInstructorTopics() {
      const userId = this.getUserId();
      if (!userId) return;

      const endpoint = `http://localhost:8080/api/statistics/${userId}/dashboardInstructor`;
      await this.fetchAndAssign(endpoint, 'instructorTopics');
    },

    /**
     * Fetches all topics authored by all instructors.
     * Intended for instructors needing visibility into content created by peers.
     */
    async fetchAllInstructorTopics() {

      const userId = this.getUserId();
      if (!userId) return;

      const endpoint = `http://localhost:8080/api/statistics/${userId}/dashboardInstructor/all`;

      await this.fetchAndAssign(endpoint, 'allTopics');
    },

    /**
     * Fetches every topic in the system.
     */
    async fetchAllTopics() {
      await this.fetchAndAssign('http://localhost:8080/api/topic', 'allTopics');
    },

    /**
     * Loads all relevant topics based on the user's role.
     * Instructors: fetch both authored and all instructor topics.
     * Students: fetch student-specific dashboard topics.
     */
    async loadTopicsForProfilePage() {
      const userId = this.getUserId();
      if (!userId) return;

      const user = useAuthUserStore().user;
      try {
        if (user.isInstructor) {
          await Promise.all([
            this.fetchInstructorTopics(),
            this.fetchAllInstructorTopics(),
          ]);
        } else {
          await this.fetchTopicsDashboard();
        }
      } catch (err) {
        console.error("Failed to load topics for profile page:", err);
      }
    },

    /**
     * Loads dashboard topics depending on user role.
     * Instructors → fetch all topics authored by instructors.
     * Students → fetch student-specific dashboard topics.
     */
    async loadTopicsForDashboard() {
      const userId = this.getUserId();
      if (!userId) return;

      const user = useAuthUserStore().user;
      try {
        if (user.isInstructor) {
          await this.fetchAllInstructorTopics();
        } else {
          await this.fetchTopicsDashboard();
        }
      } catch (err) {
        console.error("Failed to load topics for dashboard:", err);
      }
    },

    /**
     * gets topic by id from store state
     * @param {String} topicId ID of the topic
     * @returns TopicDTO with the same title, if not present returns null
     */
    getTopicById(topicId, array) {
      return array.find(topic => topic.id === topicId) || null;
    },

    /**
     * gets topic index given an ID
     * @param {String} topicId ID of the topic
     * @returns index of selected topic, if not present returns -1
     */
    getIndexById(topicId, array) {
      let i = 0;
      for (const topic of array) {
        if (topic.id === topicId) {
          return i;
        }
        i++;
      }
      return -1;
    },

    /**
     * Fetches a single topic from the backend by its ID.
     * Updates the store's `currentTopic` state.
     *
     * @param {string} id - The unique identifier of the topic to retrieve
     */
    async fetchTopicById(id) {
      try {
        const res = await fetch(`http://localhost:8080/api/topic/${id}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) {
          console.error("Failed to fetch topic by ID");
          return;
        }

        this.currentTopic = await res.json();
      } catch (error) {
        console.error("Error fetching topic by ID:", error);
      }
    },

    /**
     * POST request to create a new Topic in DB
     * @param {TopicDTO} newTopic object with info about new topic
     */
    async createTopic(newTopic) {
      try {
        const res = await fetch(`http://localhost:8080/api/topic`, {
          method: 'POST',
          credentials: 'include',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(newTopic),
        });

        if (!res.ok) {
          console.error("Failed to create a new topic");
          return;
        }

        const data = await res.json();
        data.authorFamilyName = userStore.user.familyName;
        data.authorName = userStore.user.name;
        data.studentsAttemptedCount = 0;
        data.studentsCompletedAllCount = 0;

        this.allTopics.push(data);
        this.instructorTopics.push(data);
      } catch (error) {
        console.error("Error creating new topic", error);
      }
    },

    /**
     * DELETE request to delete a specific topic from DB
     * @param {String} topicId ID of topic to be deleted
     */
    async deleteTopic(topicId) {
      try {
        const res = await fetch(`http://localhost:8080/api/topic/${topicId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!res.ok) {
          console.error("failed deleting topic with id: ", topicId);
          return;
        }

        const idx = this.getIndexById(topicId, this.topics);
        const i = this.getIndexById(topicId, this.allTopics);
        if (idx != -1) {
          this.topics.splice(idx, 1);
        }
        if (i != -1) {
          this.allTopics.splice(i, 1);
        }
      } catch (error) {
        console.error(`error when deleting topic with id: ${topicId}`, error);
      }
    },

    /**
     * PUT request to edit the info of a specific topic
     * @param {String} newTitle new title of selected topic
     * @param {String} newDescription new description of selected topic
     * @param {String} topicId ID of topic to be edited
     */
    async editTopic(newTitle, newDescription, topicId) {
      const requestBody = {
        name: newTitle,
        description: newDescription
      }
      try {
        const res = await fetch(`http://localhost:8080/api/topic/${topicId}`, {
          method: 'PUT',
          credentials: 'include',
          body: JSON.stringify(requestBody),
          headers: {'Content-Type':'application/json'},
        });

        if (!res.ok) {
          console.error("failed editing topic");
          return;
        }

        const data = await res.json();

        if (userStore.user.isInstructor) {
          const editTopic = this.getTopicById(topicId, this.allTopics);
          editTopic.name = data.name;
          editTopic.description = data.description;
        } else {
          const editedTopic = this.getTopicById(topicId, this.topics);
          editedTopic.name = data.name;
          editedTopic.description = data.description
        }

      } catch (error) {
        console.error(`error when editing topic with id: ${topicId}`, error);
      } 
    },

    /**
     * Returns the first topic that matches a given title from the `topics` array.
     *
     * @param {string} title - The name of the topic to look for
     * @returns {Object|null} The matching topic object or null if not found
     */
    getTopicByTitle(title) {
      return this.topics.find(topic => topic.name === title) || null;
    },

    /**
     * Retrieves the current user's unique ID used in backend requests.
     *
     * @returns {string|null} The user's switchEduPersonUniqueId or null if not available
     */
    getUserId() {
      const user = useAuthUserStore().user;
      if (!user?.switchEduPersonUniqueId) {
        console.warn("User ID is not available");
        return null;
      }
      return user.switchEduPersonUniqueId;
    },

    /**
     * Utility method to fetch data from a given endpoint and assign it to a specific state key.
     *
     * @param {string} endpoint - The API endpoint to fetch data from
     * @param {string} targetKey - The state property name to assign the result to
     */
    async fetchAndAssign(endpoint, targetKey) {

      try {
        const res = await fetch(endpoint, {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) {

          console.error(`Failed to fetch data for ${targetKey}`);
          return;
        }


        const data = await res.json();

        this[targetKey] = Array.isArray(data) ? data : [];
      } catch (error) {
        console.error(`Error fetching ${targetKey}:`, error.message);
      }
    },
  }
});
