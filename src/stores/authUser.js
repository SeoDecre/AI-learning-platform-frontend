import { defineStore } from 'pinia'

export const useAuthUserStore = defineStore('authUser', {
  state: () => ({
    user: null,
    switchEduID: "",
    isUserLoaded: false,
    storageUsage: null,
  }),

  actions: {
    async fetchUser() {
        try {
          const res = await fetch('http://localhost:8080/api/users/me', {
            method: 'GET',
            credentials: 'include',
          });
      
          if (!res.ok) {
            console.error("Failed to fetch user data");
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            return;
          }
      
          const data = await res.json();
          this.user = data;
          this.switchEduID = data.switchEduPersonUniqueId;
          this.isUserLoaded = true;
          
          if (data.isInstructor) {
            this.fetchStorageUsage();
          }
      
        } catch (error) {
          console.error("Error fetching user:", error.message);
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      },

      async fetchStorageUsage() {
        try {
          const res = await fetch('http://localhost:8080/api/materials/storage/used', {
            method: 'GET',
            credentials: 'include',
          });
          
          if (!res.ok) {
            console.error("Failed to fetch storage usage data");
            return;
          }
          
          const data = await res.json();
          this.storageUsage = data;
        } catch (error) {
          console.error("Error fetching storage usage:", error.message);
        }
      },

      async logout() {
        try {
          const res = await fetch('http://localhost:8080/api/users/logout', {
            method: 'GET',
            credentials: 'include',
            headers: {
              "Content-Type": "application/json",
            },
          });

          if(!res.ok) {
            console.error("couldn't log out");
            return;
          }

          this.user = null;
          this.switchEduID = "";
          this.isUserLoaded = false;
          this.storageUsage = null;
        } catch (error) {
          console.error("error logging out", error.message);
        }
      }
  }
  
})