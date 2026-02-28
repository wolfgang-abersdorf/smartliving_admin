import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/admin/dashboard'
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue'),
            meta: { requiresGuest: true }
        },
        {
            path: '/admin',
            component: () => import('../components/layout/AdminLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: 'dashboard',
                    name: 'dashboard',
                    component: () => import('../views/DashboardView.vue')
                },
                {
                    path: 'buildings',
                    name: 'buildings',
                    component: () => import('../views/BuildingsListView.vue')
                },
                {
                    path: 'buildings/new',
                    name: 'building-create',
                    component: () => import('../views/BuildingEditorView.vue')
                },
                {
                    path: 'buildings/:id',
                    name: 'building-edit',
                    component: () => import('../views/BuildingEditorView.vue')
                },
                {
                    path: 'collections',
                    name: 'collections',
                    component: () => import('../views/CollectionsListView.vue')
                },
                {
                    path: 'collections/new',
                    name: 'collection-create',
                    component: () => import('../views/CollectionEditorView.vue')
                },
                {
                    path: 'collections/:id',
                    name: 'collection-edit',
                    component: () => import('../views/CollectionEditorView.vue')
                },
                {
                    path: 'users',
                    name: 'users',
                    component: () => import('../views/UsersListView.vue')
                }
            ]
        }
    ]
})

router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore()

    // On first load, check if token exists but user is not fetched
    if (authStore.isAuthenticated && !authStore.user) {
        await authStore.fetchUser()
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'login', query: { redirect: to.fullPath } })
    } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
        next({ name: 'dashboard' })
    } else {
        next()
    }
})

export default router
