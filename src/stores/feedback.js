import { defineStore } from 'pinia'

export const useFeedbackStore = defineStore('feedback', {
    state: () => ({
        questionTitle: "",
        questionDescription: "",
        feedbacks: [],
    }),

    actions: {
        async getFeedbacks(questionId) {
            try {
              let res = await fetch(`http://localhost:8080/api/ai/AIQuestionFeedback/question/${questionId}/all`, {
                method: 'GET',
                credentials: 'include'
              });
                    
              if (!res.ok) {
                console.error("Failed to fetch exercise AI feedbacks!", res.status);
                return [];
              }
              
              const data = await res.json();

              this.questionTitle = data.questionTitle;
              this.questionDescription = data.questionDescription;
              this.feedbacks = data.feedbacks;
              return data;
            } catch (error) {
              console.error('Frontend error with fetching AI feedbacks', error);
              this.feedbacks = [];
              return [];
            }
        },

        async commentOnAIFeedback(feedbackId, instructorComment) {
          try {

            const res = await fetch(`http://localhost:8080/api/ai/commentOnAIFeedback/${feedbackId}`, {
                  method: "PUT",
                  body: instructorComment,
                  headers: {"Content-Type": "application/json"},
                  credentials: "include",
              }
            );

            if (!res.ok) {
                console.error("Couldn't comment on AI feedback");
            }

            return res.status;
          } catch (error) {
            console.error('Frontend error with fetching AI feedbacks', error);
            this.feedbacks = [];
            return [];
          }
      },
      
      async togglePublishStatus(feedbackId, currentStatus) {
          try {
              const endpoint = currentStatus ? 'unpublish' : 'publish';
              const method   = currentStatus ? 'POST'      : 'PUT';
      
              const res = await fetch(
                `http://localhost:8080/api/ai/${endpoint}/${feedbackId}`,
                { method, credentials: 'include' }
              );
              if (!res.ok) {
                console.error(`Failed to ${endpoint} feedback ${feedbackId}`);
                return;
              }
              // flip published flag in local state
              this.feedbacks = this.feedbacks.map(f =>
                f.id === feedbackId ? { ...f, published: !currentStatus } : f
              );

              return this.feedbacks;
          } catch (error) {
              console.error('Error toggling publish status:', error);
          }
        },
    }
})