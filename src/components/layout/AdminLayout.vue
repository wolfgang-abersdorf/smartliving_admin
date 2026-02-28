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
  <div class="h-screen flex bg-transparent font-['Outfit']">
    <!-- Static sidebar for desktop -->
    <div class="hidden md:flex md:flex-shrink-0">
      <div class="flex flex-col w-72 p-6">
        <div class="flex flex-col h-full glass rounded-3xl shadow-premium border border-white/40 overflow-hidden">
          <div class="flex flex-col flex-1 pt-8 pb-4 overflow-y-auto">
            <div class="flex items-center flex-shrink-0 px-6 mb-10">
              <div class="h-10 w-10 premium-gradient rounded-xl flex items-center justify-center shadow-lg mr-3">
                <OfficeBuildingIcon class="h-6 w-6 text-white" />
              </div>
              <span class="text-xl font-bold tracking-tight text-slate-800">SmartLiving</span>
            </div>
            
            <nav class="flex-1 px-4 space-y-2">
              <router-link
                v-for="item in navigation"
                :key="item.name"
                :to="item.href"
                :class="[
                  route.path.startsWith(item.href) 
                    ? 'premium-gradient text-white shadow-md shadow-indigo-200' 
                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-900', 
                  'group flex items-center px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300 ease-in-out transform hover:scale-[1.02]'
                ]"
              >
                <component
                  :is="item.icon"
                  :class="[
                    route.path.startsWith(item.href) ? 'text-white' : 'text-slate-400 group-hover:text-slate-600', 
                    'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                  ]"
                  aria-hidden="true"
                />
                {{ item.name }}
              </router-link>
            </nav>
          </div>

          <!-- Bottom Profile Section -->
          <div class="flex-shrink-0 p-4 mb-2">
            <div class="bg-white/40 rounded-2xl p-4 border border-white/60">
              <div class="flex items-center justify-between">
                <div class="flex items-center min-w-0">
                  <div class="h-9 w-9 rounded-xl bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-600 font-bold border border-white">
                    {{ authStore.user?.username?.[0]?.toUpperCase() || 'A' }}
                  </div>
                  <div class="ml-3 truncate">
                    <p class="text-sm font-bold text-slate-800 truncate">
                      {{ authStore.user?.username || 'Admin' }}
                    </p>
                    <p class="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      {{ authStore.user?.role || 'Moderator' }}
                    </p>
                  </div>
                </div>
                <button 
                  @click="handleLogout" 
                  class="ml-2 p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-95"
                  title="Sign out"
                >
                  <LogoutIcon class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content wrapper -->
    <div class="flex flex-col flex-1 w-0 h-screen overflow-hidden relative bg-transparent">
      <!-- Glow effect in background -->
      <div class="absolute -top-24 -right-24 h-96 w-96 bg-indigo-100/50 blur-[100px] rounded-full -z-10"></div>
      <div class="absolute top-1/2 -left-24 h-64 w-64 bg-purple-100/30 blur-[80px] rounded-full -z-10"></div>

      <header class="h-20 flex items-center justify-between px-8 bg-transparent">
        <div>
          <h2 class="text-sm font-medium text-slate-400">Welcome back,</h2>
          <p class="text-lg font-bold text-slate-800">{{ authStore.user?.name || authStore.user?.username || 'Admin' }}</p>
        </div>
        <div class="flex items-center gap-4">
          <!-- Notification or Search could go here -->
          <div class="h-10 w-10 glass rounded-xl flex items-center justify-center cursor-pointer hover:bg-white transition-colors border border-white/60">
            <div class="h-2 w-2 rounded-full bg-rose-500 absolute top-3 right-3 border border-white"></div>
            <svg class="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        </div>
      </header>

      <main class="flex-1 relative z-0 overflow-y-auto focus:outline-none p-8 pt-2">
        <div class="max-w-7xl mx-auto">
          <transition name="page" mode="out-in">
             <RouterView />
          </transition>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.page-enter-active, .page-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
