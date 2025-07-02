import { defineStore } from 'pinia'

export const useMaterialStore = defineStore('material', {
    state: () => ({
        materials: null,      // list of materials
        material: {},         // currently selected material
        dirty: [],            // track edited materials by ID
        feedbacks: [],        // store feedbacks here
    }),

    actions: {
        async fetchMaterials(id) {
            try {
                const res = await fetch(`http://localhost:8080/api/topic/${id}/materials`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!res.ok) {
                    console.error("Failed to fetch materials by ID");
                    this.materials = [];
                    return null;
                }

                const materials = await res.json();
                this.materials = materials;
                return materials;
            } catch (error) {
                console.error("Error fetching materials by ID:", error);
                this.materials = [];
                return null;
            }
        }, 
        
        resetMaterials() {
            this.materials = null;
        },

        findIndex(materialId) {
            return this.materials.findIndex(m => m.id === materialId);
        },

        findMaterial(materialId) {
            return this.materials.find(m => m.id === materialId) || null;
        },

        async fetchMaterialsByDraft(isDraft) {
            try {
                const res = await fetch(`http://localhost:8080/api/materials/draft/${isDraft}`, {
                    method: 'GET',
                    credentials: 'include',
                });
                if (!res.ok) {
                    console.error(`Failed to fetch materials by draft=${isDraft}`);
                    return;
                }
                this.materials = await res.json();
            } catch (error) {
                console.error('Error fetching materials by draft:', error);
            }
        },

        async createMaterial(createDto, file, topicId = null) {
            try {
                let res;

                if (file) {
                    const form = new FormData();
                    form.append('title', createDto.title);
                    form.append('type', createDto.type);
                    form.append('isDraft', createDto.isDraft);
                    if (createDto.content) form.append('content', createDto.content);
                    form.append('file', file);

                    res = await fetch(
                        `http://localhost:8080/api/materials/topics/${topicId}/create`, {
                            method: 'POST',
                            credentials: 'include',
                            body: form
                        }
                    );

                } else {
                    res = await fetch(
                        `http://localhost:8080/api/materials/topics/${topicId}/create`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(createDto)
                        }
                    );
                }

                if (!res.ok) {
                    console.error(
                        'Failed to create material',
                        res.status,
                        await res.text()
                    );
                    return null;
                }

                const newMaterial = await res.json();
                this.materials.push(newMaterial);
                return newMaterial;
            } catch (error) {
                console.error('Error creating material:', error);
                return null;
            }
        },

        async updateMaterial(materialId, updateDto, file = null) {
            try {
                let res;
                if (file) {
                    const form = new FormData();
                    form.append('dto', new Blob([JSON.stringify(updateDto)], { type: 'application/json' }));
                    form.append('file', file);
                    res = await fetch(`http://localhost:8080/api/materials/update/${materialId}`, {
                        method: 'PUT',
                        credentials: 'include',
                        body: form,
                    });
                } else {
                    res = await fetch(`http://localhost:8080/api/materials/update/${materialId}`, {
                        method: 'PUT',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updateDto),
                    });
                }
                if (res.status === 404) {
                    console.warn(`Material ${materialId} not found`);
                    return null;
                }
                if (!res.ok) {
                    console.error('Failed to update material', res.status, await res.text());
                    return null;
                }
                const updated = await res.json();
                const idx = this.findIndex(materialId);
                if (idx !== -1) this.materials.splice(idx, 1, updated);
                return updated;
            } catch (error) {
                console.error('Error updating material:', error);
                return null;
            }
        },

        async deleteMaterial(materialId) {
            try {
                const res = await fetch(`http://localhost:8080/api/materials/${materialId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
                if (res.status === 404) {
                    console.warn(`Material ${materialId} not found`);
                    return;
                }
                if (!res.ok) {
                    console.error('Failed to delete material');
                    return;
                }
                const idx = this.findIndex(materialId);
                if (idx !== -1) this.materials.splice(idx, 1);
            } catch (error) {
                console.error('Error deleting material:', error);
            }
        },

        async askQuestion(materialId, questionDto) {
            try {
                if (!questionDto.highlightedText?.trim() || !questionDto.question?.trim()) {
                    console.error("Highlighted text and question must not be empty");
                    return null;
                }
          
                const res = await fetch(`http://localhost:8080/api/materials/ask/${materialId}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(questionDto),
                });
          
                if (!res.ok) {
                    const errText = await res.text();
                    console.error('Failed to get answer for question', res.status, errText);
                    return null;
                }

                const dto = await res.json();
                return dto;
            } catch (error) {
              console.error('Error asking question:', error);
              return null;
            }
        },

        async fetchTeacherFeedbacks(materialId) {
            try {
                const res = await fetch(`http://localhost:8080/api/ai/AIMaterialFeedback/${materialId}/all`,
                    { method: 'GET', credentials: 'include' }
                );
                if (!res.ok) {
                    console.error(`Failed to fetch feedbacks for material ${materialId}`);
                    this.feedbacks = [];
                    return;
                }

                const feedbacks = await res.json();
                this.feedbacks = feedbacks || [];
                return feedbacks;
            } catch (error) {
                console.error('Error fetching feedbacks:', error);
                this.feedbacks = [];
            }
        },

        async fetchStudentFeedbacks(materialId) {
            try {
                // TODO: Implement this when route exists
                // TODO: SHOW STARS TO STUDENTS PUBLIC ANSWERS
                // const res = await fetch(`http://localhost:8080/api/ai/AIMaterialFeedback/${materialId}/all`,
                //     { method: 'GET', credentials: 'include' }
                // );
                // if (!res.ok) {
                //     console.error(`Failed to fetch feedbacks for material ${materialId}`);
                //     this.feedbacks = [];
                //     return;
                // }

                // const feedbacks = await res.json();
                // this.feedbacks = feedbacks || [];
                // return feedbacks;
                return [];
            } catch (error) {
                console.error('Error fetching feedbacks:', error);
                this.feedbacks = [];
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

        // async askQuestion(materialId, questionDto) {
        //     try {
        //         if (!questionDto.highlightedText?.trim() || !questionDto.question?.trim()) {
        //         console.error("Highlighted text and question must not be empty");
        //         return null;
        //         }
            
        //         // simulate network latency
        //         await new Promise(resolve => setTimeout(resolve, 2000));
            
        //         // return a dummy answer
        //         return "Example of response.Example of response.Example of response.Example of response.\nExample of response.\nExample of response.\n";
            
        //     } catch (error) {
        //         console.error('Error asking question:', error);
        //         return null;
        //     }
        // },

        async submitRating(ratingDto) {
            try {
                const res = await fetch(`http://localhost:8080/api/ratings/add`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(ratingDto),
                });

                if (!res.ok) throw new Error(await res.text());
                return await res.json();
            } catch (error) {
                console.error("Error submitting rating:", error);
                throw error;
            }
        },
    }
});
