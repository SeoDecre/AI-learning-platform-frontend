import { createRouter, createWebHistory } from "vue-router";
import { useAuthUserStore } from '@/stores/authUser'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
    {
      path: '/',
      redirect: '/topics'
    },
    {
      path: '/topics',
      name: 'topicList',
      component: () => import('../views/TopicsView.vue'),
    },
    {
      path: '/topic/:topicId',
      name: 'topic',
      component: () => import('../views/TopicView.vue'),
      children: [
        {
          path: 'exercises',
          name: 'exercises',
          component: () => import('../views/ExerciseListView.vue'),
        }, 
        {
          path: 'materials',
          name: 'materials',
          component: () => import('../views/MaterialsView.vue'),
        },
      ]
    },
    {
      path: '/:topicId/edit/:exerciseId',
      name: 'EditExercise',
      component: () => import('../views/EditExerciseView.vue'),
    },
    {
      path: '/:topicId/exercise/:exerciseId',
      name: 'ExerciseView',
      component: () => import('../views/ExerciseView.vue'),
    },
    {
      path: '/:topicId/statistics/:exerciseId',
      name: 'ExerciseStatistics',
      component: () => import('../views/ExerciseStatistics.vue'),
    },
    {
      path: '/:topicId/openAnswerReview/:exerciseId',
      name: 'ExerciseAnswerFeedbacksList',
      component: () => import('../views/ExerciseAnswerFeedbacksList.vue'),
    },
    { path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue') 
    },
    { path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue') 
    },
    {
        path: '/users/:id',
        name: 'UserProfile',
        component: () => import('../views/UserProfileView.vue')
    },
    {
        path: '/UserLookUpView',
        name: 'UserLookUpView',
        component: () => import('../views/UserLookUpView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue')
    },

  ],
})

router.beforeEach(async (to, from, next) => {
  if (to.name === 'login') return next()

  const authStore = useAuthUserStore()

  if (!authStore.user) {
    await authStore.fetchUser()
  }

  if (!authStore.user) {
    const routeMessages = {
      profile: "Please log in to view your profile.",
      topics: "Please log in to explore topics.",
      materials: "Please log in to view materials.",
      exercises: "Please log in to practice exercises.",
      default: "You must be logged in to access this page.",
    };

    const message = routeMessages[to.name] || routeMessages.default;
    sessionStorage.setItem('redirectedDueToAuth', message);

    return next('/login')
  }

  next()
})


export default router;
