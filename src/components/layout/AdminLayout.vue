<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import {
  HomeIcon,
  BuildingOfficeIcon as OfficeBuildingIcon,
  UsersIcon,
  FolderOpenIcon,
  ArrowRightOnRectangleIcon as LogoutIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'Buildings', href: '/admin/buildings', icon: OfficeBuildingIcon },
  { name: 'Collections', href: '/admin/collections', icon: FolderOpenIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
]

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="h-screen flex overflow-hidden bg-gray-100">
    <!-- Static sidebar for desktop -->
    <div class="hidden md:flex md:flex-shrink-0">
      <div class="flex flex-col w-64">
        <div class="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div class="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div class="flex items-center flex-shrink-0 px-4">
              <span class="text-xl font-bold text-indigo-600">SmartLiving Admin</span>
            </div>
            <nav class="mt-5 flex-1 px-2 bg-white space-y-1">
              <router-link
                v-for="item in navigation"
                :key="item.name"
                :to="item.href"
                :class="[route.path.startsWith(item.href) ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900', 'group flex items-center px-2 py-2 text-sm font-medium rounded-md']"
              >
                <component
                  :is="item.icon"
                  :class="[route.path.startsWith(item.href) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500', 'mr-3 flex-shrink-0 h-6 w-6']"
                  aria-hidden="true"
                />
                {{ item.name }}
              </router-link>
            </nav>
          </div>
          <div class="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div class="flex-shrink-0 group block w-full">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {{ authStore.user?.email || 'Admin' }}
                  </p>
                  <p class="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                    {{ authStore.user?.role || 'Administrator' }}
                  </p>
                </div>
                <button @click="handleLogout" class="text-gray-400 hover:text-red-500 p-2">
                  <LogoutIcon class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content wrapper -->
    <div class="flex flex-col w-0 flex-1 overflow-hidden">
      <main class="flex-1 relative z-0 overflow-y-auto focus:outline-none">
        <div class="py-6">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <RouterView />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
