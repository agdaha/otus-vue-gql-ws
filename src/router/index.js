import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const routes = [
  {
    path: '/',
    redirect: '/chat/public'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/Auth/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../pages/Auth/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../pages/Auth/ResetPassword.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/chat/:channelId',
    name: 'Chat',
    component: () => import('../pages/Chat/MainChat.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/users',
    name: 'UsersAdmin',
    component: () => import('../pages/Admin/UsersAdmin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/channels',
    name: 'ChannelsAdmin',
    component: () => import('../pages/Admin/ChannelsAdmin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const { checkAuth, user } = useAuth()
  const currentUser = await checkAuth()
  
  if (to.meta.requiresAuth && !currentUser) {
    next('/login')
  } else if (to.meta.requiresGuest && currentUser) {
    next('/')
  } else if (to.meta.requiresAdmin && currentUser?.role !== 'admin') {
    next('/')
  } else {
    next()
  }
})

export default router