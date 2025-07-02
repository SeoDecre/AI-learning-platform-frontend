import { defineStore } from 'pinia'

export const useUserStore = defineStore('userStore', {
    state: () => ({
        user: null,
        searchResults: [],
        isSearching: false,
        searchError: null
    }),

    actions: {
        async searchUsers(query) {

            this.searchError = null
            this.searchResults = []

            if (!query || !query.trim()) {

                this.searchError = 'Search term cannot be empty'
                return
            }

            this.isSearching = true

            try {
                const url = `http://localhost:8080/api/users/search?query=${encodeURIComponent(query)}`

                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include'
                })


                if (response.status === 400) {
                    this.searchError = 'Please enter at least one character'
                } else if (response.status === 404) {
                    this.searchError = 'No users found'
                } else if (!response.ok) {
                    throw new Error(`Unexpected status ${response.status}`)
                } else {

                    const data = await response.json()

                    this.searchResults = data
                }
            } catch (err) {
                console.error('[searchUsers] error caught:', err)
                this.searchError = err.message || 'Error searching users'
            } finally {
                this.isSearching = false

            }
        },

        async fetchUserById(id) {

            try {
                const res = await fetch(`http://localhost:8080/api/users/${id}`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!res.ok) {
                    throw new Error(`Status ${res.status}`)
                }
                this.user = await res.json()
                this.isLoaded = true;


            } catch (err) {
                console.error('[fetchUserById] error:', err)
                this.fetchError = err.message
            }
        },
    }
})